/**
 * Module dependencies.
 */

var env = require('./env');
Object.keys(env).forEach(function (key) {
  process.env[key] = env[key];
});

require('newrelic');
var async = require('async');
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var LeveldbStore = require('connect-leveldb')(express);
var oneDay = 1000 * 60 * 60 * 24;

var secrets = require('./lib/secrets');

function startServer(done) {
  var app = express();

  app.locals.env = app.get('env');

  // all environments
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/lib/views');
  app.set('view engine', 'jade');
  app.set('trust proxy', !!process.env.NGINX_PROXY);
  app.use(express.favicon());
  app.use(express.logger('dev'));

  if (app.get('env') === 'development') {
    app.use(express.static(path.join(__dirname, 'public')));
  }

  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.methodOverride());
  app.use(express.cookieParser(secrets.cookie));
  app.use(express.session({
    secret: secrets.session,
    key: 'sid',
    store: new LeveldbStore({
      dbLocation: __dirname + '/session.db',
      ttl: oneDay
    })
  }));

  app.use((function () {
    function sendAsText() {
      this.set('Content-Type', 'text/plain');
      this.send.apply(this, arguments);
    }

    return function (req, res, next) {
      res.text = sendAsText;

      if (req.session && req.session.user) {
        req.loggedIn = true;
        res.locals.user = req.user = req.session.user;
      } else {
        req.loggedIn = false;
      }

      process.nextTick(next);
    };
  })());

  app.use(app.router);
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));

  // development only
  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  } else {
    /* jshint unused: false */
    // must have 4 args to get the error
    app.use(function (err, req, res, next) {
      if (!(err instanceof Error)) {
        err = new Error(err);
      }

      console.error(err.stack);
      res.text(500, 'Something\'s broke! (' + err.message + ')');
    });
    /* jshint unused: true */
  }

  fs.readdirSync(__dirname + '/lib/routes').forEach(function (file) {
    require(__dirname + '/lib/routes/' + file)(app);
  });

  http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
    done();
  });
}


async.series([
  secrets.init,
  startServer
]);