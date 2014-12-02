#!/usr/bin/env node

'use strict';

require('dotenv').load();

var async = require('async');
var Bot = require('./models/bot.js');
var db = require('./lib/db.js');
var program = require('commander');
var twitterBotLists = require('twitter-bot-lists');

program
  .command('load-bot-lists')
  .description('Load/update Twitter bots from bot lists')
  .action(function () {
    twitterBotLists(function (err, bots) {
      if (err) {
        throw err;
      }

      console.log('Updating %d bots', bots.length);

      db(function () {
        async.each(bots, function (bot, cbEach) {
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

program.parse(process.argv);