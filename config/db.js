var mongoose = require('mongoose');

module.exports = function(config) {
  var db_url = process.env.MONGO_URI || config.db;
  console.log("[DB.JS]: db_url: ", db_url);
  mongoose.connect(db_url);
  var db = mongoose.connection;

  db.on('error', function() {
    throw new Error('Unable to connect to database at ' + db_url);
  });
};