'use strict';

var mongoose = require('mongoose');

// if (process.env.DEBUG) {
//   mongoose.set('debug', true);
// }

console.log('Connecting to', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI);

var db = mongoose.connection;

db.on('error', function (err) {
  throw err;
});

module.exports = function (cb) {
  db.once('open', function () {
    console.log('Connected');

    cb();
  });
};

module.exports.mongoose = mongoose;
