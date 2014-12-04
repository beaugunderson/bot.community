#!/usr/bin/env node

'use strict';

require('dotenv').load();

var async = require('async');
var Bot = require('./models/bot.js');
var db = require('./lib/db.js');
var fs = require('fs');
var program = require('commander');
var twitterBotLists = require('twitter-bot-lists');

program
  .command('load-bot-lists')
  .description('Load/update Twitter bots from bot lists')
  .action(function () {
    db(function () {
      twitterBotLists(function (err, bots) {
        if (err) {
          throw err;
        }

        console.log('Updating %d bots', bots.length);

        async.each(bots, function (bot, cbEach) {
          console.log(bot.screenName);

          bot.refreshed = new Date();

          Bot.findOneAndUpdate(
            {'twitter.screenName': bot.screenName},
            {twitter: bot},
            {upsert: true},
            cbEach);
        }, function (err) {
          if (err) {
            throw err;
          }

          console.log('Done');

          process.exit(0);
        });
      });
    });
  });

program
  .command('update-filtered-bots')
  .action(function () {
    db(function () {
      console.log('Updating filtered bots');

      Bot.find()
        .where('reports').gt(0)
        .exec(function (err, bots) {
          if (err) {
            throw err;
          }

          var screenNames = bots.map(function (bot) {
            return bot.twitter.screenName;
          });

          fs.writeFile('filtered-bots.json',
            JSON.stringify(screenNames, null, 2),
              function (err) {
                if (err) {
                  throw err;
                }

                process.exit(0);
              });
      });
    });
  });

program
  .command('reset-reports')
  .action(function () {
    db(function () {
      Bot.find({}, function (err, bots) {
        if (err) {
          throw err;
        }

        async.each(bots, function (bot, cbEach) {
          console.log(bot.twitter.screenName);

          bot.reports = 0;
          bot.save(cbEach);
        }, function (err) {
          if (err) {
            throw err;
          }

          console.log('Done');

          process.exit(0);
        });
      });
    });
  });

program.parse(process.argv);
