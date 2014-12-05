'use strict';

var mongoose = require('mongoose');

// if (process.env.DEBUG) {
//   mongoose.set('debug', true);
// }

exports.mongoose = mongoose;

exports.connect = function () {
  console.log('Connecting to', process.env.MONGODB_URI);

  mongoose.connect(process.env.MONGODB_URI);
};

exports.onConnection = function connect (cb) {
  var db = mongoose.connection;

  db.on('error', function (err) {
    throw err;
  });

  db.once('open', function () {
    console.log('Connected');

    cb();
  });
};
