'use strict';

var mongoose = require('mongoose');

var tagSchema = new mongoose.Schema({
  key: String,
  value: String
});

var botSchema = new mongoose.Schema({
  twitter: {
    id: String,
    name: String,
    screenName: String,
    avatar: String,
    description: String,
    urls: [String],
    usernames: [String],
    hashtags: [String],
    location: String,
    createdAt: Date,
    statuses: Number,
    listed: Number,
    followers: Number,
    refreshed: Date
  },
  tags: [tagSchema],
  updated: {
    type: Date,
    default: Date.now
  }
});

botSchema.methods.updateTwitter = function (cb) {
  // TODO: update the twitter data using the Twitter API

  cb();
};

botSchema.statics.countTags = function (cb) {
  this.aggregate()
    .unwind('tags')
    .group({
      _id: {key: '$tags.key'},
      count: {$sum: 1}
    })
    .project({
      key: '$_id.key',
      count: '$count',
      _id: 0
    })
    .exec(cb);
};

module.exports = mongoose.model('Bot', botSchema);
