'use strict';

var addCommas = require('add-commas');
var bodyParser = require('body-parser');
var db = require('./lib/db.js');
var Bot = require('./models/bot.js');
var cookieParser = require('cookie-parser');
var express = require('express');
var morgan = require('morgan');
var passport = require('./lib/passport.js');
var session = require('express-session');
var swig = require('swig');
// var _ = require('lodash');

var DEBUG = process.env.DEBUG;
var PORT = process.env.PORT;

// Keep track of where we should return to if the user decides to authenticate
function trackReturnTo(req, res, next) {
  req.session.returnTo = req.originalUrl;

  next();
}

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

app.use(morgan('dev'));

app.use(express.static('./static'));

app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
  res.locals.user = req.user;
  res.locals.authenticated = !req.user;
  res.locals.session = req.session;

  next();
});

app.get('/', trackReturnTo, function (req, res) {
  res.render('index', {home: true});
});

app.get('/bots/:screenName/', trackReturnTo, function (req, res) {
  Bot.findOne({'twitter.screenName': req.params.screenName},
    function (err, result) {
      if (err || !result) {
        return res.sendStatus(404);
      }

      res.render('bot-detail', {bot: result});
    });
});

app.get('/autocomplete/:term/', function (req, res) {
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

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successReturnToOrRedirect: '/'
}));

app.get('/logout', function (req, res) {
  var returnToOrHome = req.session.returnTo || '/';

  req.logout();

  res.redirect(returnToOrHome);
});

db(function () {
  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('bot.community listening at http://%s:%s', host, port);
  });
});
