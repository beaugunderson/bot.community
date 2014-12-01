'use strict';

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var express = require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var swig = require('swig');
var TwitterStrategy = require('passport-twitter').Strategy;

var DEBUG = process.env.DEBUG;

// if (DEBUG) {
//   mongoose.set('debug', true);
// }

var Bot = require('./models/bot.js');
var User = require('./models/user.js');

var PORT = process.env.PORT;

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_KEY,
  consumerSecret: process.env.TWITTER_SECRET
}, function (token, tokenSecret, profile, cb) {
  User.findOneAndUpdate({
    'profile.id': profile.id
  }, {
    twitterToken: token,
    twitterSecret: tokenSecret,
    profile: profile,
    // TODO: This updates on every login
    created: new Date()
  }, {
    upsert: true
  }, cb);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user.profile.id);
});

passport.deserializeUser(function (id, cb) {
  User.findOne({'profile.id': id}, cb);
});

var app = express();

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', './views');

if (DEBUG) {
  app.set('view cache', false);
}

swig.setDefaults({cache: false});

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

app.get('/', function (req, res) {
  res.render('index', {
    user: req.user,
    session: req.session
  });
});

app.get('/bots/search/:term', function (req, res) {
  Bot.find({'twitter.screenName': new RegExp(req.params.term)},
      function (err, results) {
    res.send(results);
  });
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/'
}));

mongoose.connect('mongodb://localhost/bot-community');

var db = mongoose.connection;

db.on('error', function (err) {
  throw err;
});

db.once('open', function () {
  var server = app.listen(PORT, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('bot.community listening at http://%s:%s', host, port);
  });
});
