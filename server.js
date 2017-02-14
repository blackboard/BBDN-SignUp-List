var express = require('express');
var config = require('./config/config');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./controllers/routes/index');
var users = require('./controllers/routes/users');
var systems = require('./controllers/routes/systems');
var courses = require('./controllers/routes/courses');
var lists = require('./controllers/routes/lists');
var logs = require('./controllers/routes/logs');

//set up mongoose
//determine db path
var db = process.env.MONGODB_URI || config.test_db;
// Bring Mongoose into the app 
var mongoose = require( 'mongoose' ); 
// Create the database connection 
mongoose.connect(db); 

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection open to ' + db );
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose default connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/systems', systems);
app.use('/courses', courses);
app.use('/lists', lists);
app.use('/logs', logs);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log('error ' + res.status + ': ' + err.message + '<br />' + err.stack);
  res.write('error ' + res.status + ': ' + err.message + '<br />' + err.stack);
  res.send();
});

module.exports = app;
