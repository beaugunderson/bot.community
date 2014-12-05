'use strict';

var addCommas = require('add-commas');
var async = require('async');
var Autolinker = require('autolinker');
var bodyParser = require('body-parser');
var db = require('./lib/db.js');
var cookieParser = require('cookie-parser');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var express = require('express');
var morgan = require('morgan');
var passport = require('./lib/passport.js');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var swig = require('swig');

var Bot = require('./models/bot.js');
var User = require('./models/user.js');
var TagRevision = require('./models/tag-revision.js');

var DEBUG = process.env.DEBUG;
var PORT = process.env.PORT;

// Keep track of where we should return to if the user decides to authenticate
// TODO: the back button breaks this (it remains set to the page you came from)
function trackReturnTo(req, res, next) {
  req.session.returnTo = req.originalUrl;

  next();
}

function botOr404(req, res, next) {
  Bot.findOne({'twitter.screenName': req.params.screenName},
    function (err, bot) {
      if (err || !bot) {
        return res.sendStatus(404);
      }

      req.bot = bot;

      next();
    });
}

function userOr404(req, res, next) {
  User.findOne({'profile.username': req.params.screenName},
      function (err, user) {
    if (err || !user) {
      return res.sendStatus(404);
    }

    TagRevision.find({userId: user.profile.id},
        function (ignoredError, tagRevisions) {
      req.twitterUser = user;
      req.tagRevisions = tagRevisions;

      next();
    });
  });
}

var ensureTwitterLoggedIn = ensureLoggedIn({redirectTo: '/auth/twitter'});

db.connect();

var app = express();

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', './views');

if (DEBUG) {
  app.set('view cache', false);
}

swig.setDefaults({cache: false});

swig.setFilter('commas', addCommas);

swig.setFilter('avatar', function (input, size) {
  if (size === 'original') {
    return input.replace('_normal', '');
  }

  return input;
});

// Tell swig this function is safe to skip filtering for
Autolinker.link.safe = true;

swig.setFilter('autolink', Autolinker.link);

app.use(morgan('dev'));

app.use(express.static('./static'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    mongoose_connection: db.mongoose.connection
  })
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.locals.user = req.user;
  res.locals.authenticated = req.user !== undefined;
  res.locals.session = req.session;

  next();
});

function aggregates(cb) {
  async.parallel({
    most: Bot.mostFollowers.bind(Bot),
    least: Bot.leastFollowers.bind(Bot),
    newest: Bot.newest.bind(Bot),
    tagCounts: Bot.tagCounts.bind(Bot)
  }, cb);
}

app.get('/', trackReturnTo, function (req, res) {
  aggregates(function (ignoredError, aggregated) {
    res.render('index', {home: true, aggregates: aggregated});
  });
});

app.get('/guide/tagging', function (req, res) {
  res.send('Coming soon...');
});

app.get('/tags/autocomplete/:term/', function (req, res) {
  res.send([]);
});

app.get('/bots/autocomplete/:term/', function (req, res) {
  Bot.find({'twitter.screenName': new RegExp(req.params.term)},
      function (err, results) {
    if (err) {
      return res.send([]);
    }

    res.send(results.map(function (bot) {
      return {
        value: bot.twitter.screenName,
        tags: bot.tags
      };
    }));
  });
});

app.get('/aggregates/', function (req, res) {
  aggregates(function (err, aggregated) {
    if (err) {
      return res.send(err);
    }

    res.send(aggregated);
  });
});

app.get('/users/:screenName/', trackReturnTo, userOr404, function (req, res) {
  res.render('user-detail', {
    user: req.twitterUser,
    tagRevisions: req.tagRevisions
  });
});

app.get('/bots/:screenName/', trackReturnTo, botOr404, function (req, res) {
  res.render('bot-detail', {bot: req.bot});
});

app.get('/bots/:screenName/tags/', botOr404, function (req, res) {
  res.send(req.bot.tags);
});

app.post('/bots/:screenName/tags/', ensureTwitterLoggedIn, botOr404,
    function (req, res) {
  req.bot.createTag(req.user, req.body.key, req.body.value,
      function (err, tag) {
    if (err) {
      return res.status(400).send({error: err.message});
    }

    res.send(tag);
  });
});

app.post('/bots/:screenName/tags/:tagId/', ensureTwitterLoggedIn, botOr404,
    function (req, res) {
  req.bot.updateTag(req.user, req.params.tagId, req.body.key, req.body.value,
      function (err, tag) {
    if (err) {
      return res.status(400).send({error: err.message});
    }

    res.send(tag);
  });
});

app.post('/bots/:screenName/report/', ensureTwitterLoggedIn, botOr404,
    function (req, res) {
  req.bot.report(function (err) {
    if (err) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  });
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successReturnToOrRedirect: '/'
}));

app.get('/logout', function (req, res) {
  var returnToOrHome = req.session.returnTo || '/';

  req.logout();

  res.redirect(returnToOrHome);
});

db.onConnection(function () {
  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('bot.community listening at http://%s:%s', host, port);
  });
});
