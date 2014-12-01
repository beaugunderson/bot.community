var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  twitterToken: String,
  twitterSecret: String,
  profile: {},
  created: Date
});

module.exports = mongoose.model('User', userSchema);
