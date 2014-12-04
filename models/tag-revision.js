'use strict';

var mongoose = require('mongoose');

var tagRevisionSchema = new mongoose.Schema({
  action: String,

  oldTag: {
    key: String,
    value: String
  },

  newTag: {
    key: String,
    value: String
  },

  userId: {type: String, index: true},
  userScreenName: String,

  botId: {type: String, index: true},
  botScreenName: String,

  created: {type: Date, default: Date.now}
});

tagRevisionSchema.statics.fromTagAction =
    function (action, oldTag, newTag, user, bot, cb) {
  this.create({
    action: action,
    oldTag: oldTag,
    newTag: newTag,
    userId: user.profile.id,
    userScreenName: user.profile.username,
    botId: bot.id,
    botScreenName: bot.screenName
  }, cb);
};

module.exports = mongoose.model('TagRevision', tagRevisionSchema);
