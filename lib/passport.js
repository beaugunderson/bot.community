'use strict';

var passport = module.exports = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var User = require('../models/user.js');

passport.use(new TwitterStrategy({
  consumerKey: process.env.CONSUMER_KEY,
  consumerSecret: process.env.CONSUMER_SECRET
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
