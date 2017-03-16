var express = require('express');
var config = require('./config/config');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('cookie-session');

var index = require('./controllers/routes/index');
var users = require('./controllers/routes/users');
var systems = require('./controllers/routes/systems');
var courses = require('./controllers/routes/courses');
var lists = require('./controllers/routes/lists');
var logs = require('./controllers/routes/logs');
var rest = require('./controllers/routes/rest');

var debug = (config.debug_mode=="true"?true:false);

//set up mongoose
//determine db path
var db = process.env.MONGO_URI || config.test_db;
// Bring Mongoose into the app
var mongoose = require( 'mongoose' );
// Create the database connection
if (debug) console.log("[SERVER.JS]:db: ", db);
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

//added to enable Heroku to handle proper SSL termination
app.enable('trust proxy');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  name: 'signuplistv1',
  secret: '282r5O>Dg0hu?A4',
  resave: false,
  saveUninitialized: true
}))

app.use(express.static(path.join(__dirname, '/public')));
app.use('/datetimepicker', express.static(path.join(__dirname, '/node_modules/angular-bootstrap-datetimepicker/src/')));
app.use('/moment', express.static(path.join(__dirname, '/node_modules/moment')));

app.use('/', index);
app.use('/users', users);
app.use('/systems', systems);
app.use('/courses', courses);
app.use('/lists', lists);
app.use('/logs', logs);
app.use('/api', rest);

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
