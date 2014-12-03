'use strict';

var mongoose = require('mongoose');
var TagRevision = require('./tag-revision.js');

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
    mainUrl: String,
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
  updated: {type: Date, default: Date.now}
});

botSchema.methods.updateTwitter = function (cb) {
  // TODO: update the twitter data using the Twitter API

  cb();
};

botSchema.methods.createTag = function (user, key, value, cb) {
  // TODO: Can mongoose validate this for us?
  if (!key || !value) {
    return cb(new Error('key and value are both required'));
  }

  var tag = {key: key, value: value};

  var self = this;

  TagRevision.fromTagAction('create', tag, user, this.twitter, function (err) {
    if (err) {
      return cb(err);
    }

    var newTag = self.tags.create(tag);

    self.tags.push(newTag);

    self.save(function (err) {
      if (err) {
        return cb(err);
      }

      cb(null, newTag);
    });
  });
};

botSchema.methods.updateTag = function (user, id, key, value, cb) {
  var tag = this.tags.id(id);

  if (!tag) {
    return cb(new Error('tag with id ' + id + ' not found'));
  }

  tag.key = key;
  tag.value = value;

  var self = this;

  TagRevision.fromTagAction('update', tag, user, this.twitter, function (err) {
    if (err) {
      return cb(err);
    }

    self.save(function (err) {
      if (err) {
        return cb(err);
      }

      cb(null, tag);
    });
  });
};

botSchema.methods.deleteTag = function (user, id, cb) {
  var tag = this.tags.id(id);

  if (!tag) {
    return cb(new Error('tag with id ' + id + ' not found'));
  }

  var self = this;

  TagRevision.fromTagAction('delete', tag, user, this.twitter, function (err) {
    if (err) {
      return cb(err);
    }

    tag.remove();

    self.save(cb);
  });
};

botSchema.statics.newest = function (cb) {
  this.find()
    .limit(25)
    .sort('-twitter.createdAt')
    .select('twitter.screenName twitter.createdAt')
    .exec(cb);
};

botSchema.statics.mostFollowers = function (cb) {
  this.find()
    .limit(25)
    .sort('-twitter.followers twitter.screenName')
    .select('twitter.screenName twitter.followers')
    .exec(cb);
};

botSchema.statics.leastFollowers = function (cb) {
  this.find()
    .limit(25)
    .sort('twitter.followers twitter.screenName')
    .select('twitter.screenName twitter.followers')
    .exec(cb);
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
