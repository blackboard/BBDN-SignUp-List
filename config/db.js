var mongoose = require('mongoose');

module.exports = function(config) {
  var db = process.env.MONGO_URI || config.db;
  mongoose.connect(db);
  var db = mongoose.connection;

  db.on('error', function() {
    throw new Error('Unable to connect to database at ' + db);
  });
};