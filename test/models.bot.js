'use strict';

require('chai').should();

var mongoose = require('mongoose');
var Bot = require('../models/bot.js');

var DATABASE_URI = 'mongodb://localhost/test-bot-community';

describe('Bot', function () {
  before(function (done) {
    if (mongoose.connect.db) {
      return done();
    }

    mongoose.connect(DATABASE_URI, done);
  });

  it('should create a new model', function (cb) {
    var bot = new Bot({twitter: {id: '123456'}});

    bot.save(function (err) {
      if (err) {
        return cb(err);
      }

      Bot.findOne({'twitter.id': '123456'}, function (err, foundBot) {
        if (err) {
          return cb(err);
        }

        foundBot.twitter.id.should.equal('123456');

        cb();
      });
    });
  });

  it('should allow key/value tagging', function (cb) {
    Bot.findOne({'twitter.id': '123456'}, function (err, foundBot) {
      if (err) {
        return cb(err);
      }

      foundBot.tags.push({key: 'tag-key-1', value: 'tag-value'});
      foundBot.tags.push({key: 'tag-key-1', value: 'tag-value'});
      foundBot.tags.push({key: 'tag-key-2', value: 'tag-value'});
      foundBot.tags.push({key: 'tag-key-3', value: 'tag-value'});

      foundBot.save(function (err) {
        if (err) {
          return cb(err);
        }

        console.log(JSON.stringify(foundBot, null, 2));

        cb();
      });
    });
  });

  it('should aggregate correctly', function (cb) {
    Bot.aggregate()
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
      .exec(function (err, results) {
        if (err) {
          return cb(err);
        }

        console.log(JSON.stringify(results, null, 2));

        cb();
      });
  });

  after(function (done) {
    if (!process.env.KEEP_DATABASE) {
      mongoose.connection.db.dropDatabase();
    }

    done();
  });
});
