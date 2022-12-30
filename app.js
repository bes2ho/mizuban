var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// const router=express.Router();

// const session = require("express-session");

// const methodOverride = require('method-override');
// router.use(methodOverride("_method",{
//   methods:["POST", "GET"]
// }));

// require the DB connection to happen from the connection.js
require('./config/connection');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const mapRouter = require('./routes/map');
// const router = require('./routes/map');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// const bodyParser = require('body-parser');
// app.use(bodyParser.urlencoded({extended: false}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({
//   secret: "secret word",
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     maxAge: 60 * 1000 * 1000000
//   }
//   }));

const sessionCheck = (req, res, next) => {
  if (req.cookies.myId)
      next()
  else {
      res.redirect('/');
  }
};
// 以下のコードですべてのルートの前処理ができる？
// app.use((req, res, next) => {
//     console.log(req.cookies.message);

//     res.cookie('message', 'hello world!', { maxAge: 12000, httpOnly: false });

//     next();
// });
app.use('/', indexRouter);
app.use('/', sessionCheck); // 以下のルートをチェック
// app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/map', mapRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
