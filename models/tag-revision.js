'use strict';

var mongoose = require('mongoose');

var tagRevisionSchema = new mongoose.Schema({
  action: String,

  key: String,
  value: String,

  userId: {type: String, index: true},
  userScreenName: String,

  botId: {type: String, index: true},
  botScreenName: String
});

tagRevisionSchema.statics.fromTagAction =
    function (action, tag, user, bot, cb) {
  this.create({
    action: action,
    key: tag.key,
    value: tag.value,
    userId: user.profile.id,
    userScreenName: user.profile.username,
    botId: bot.id,
    botScreenName: bot.screenName
  }, cb);
};

module.exports = mongoose.model('TagRevision', tagRevisionSchema);
