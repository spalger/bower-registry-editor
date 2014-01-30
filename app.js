/**
 * Module dependencies.
 */

var env = require('./env');
Object.keys(env).forEach(function (key) {
  process.env[key] = env[key];
});

require('newrelic');
var crypto = require('crypto');
var async = require('async');
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var auth = require('./lib/auth_mw');
var LruSessionStore = require('./lib/lru_session');

var secrets = {
  cookie: null,
  session: null
};

function makeupSecret(name, done) {
  crypto.randomBytes(256, function (err, buf) {
    if (err) return done(err);
    secrets[name] = '' + buf;
    done();
  });
}

function startServer(done) {
  var app = express();

  // all environments
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/lib/views');
  app.set('view engine', 'jade');
  app.set('trust proxy', !!process.env.NGINX_PROXY);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser(secrets.cookie));
  app.use(express.session({
    secret: secrets.session,
    key: 'sid',
    store: new LruSessionStore()
  }));
  app.use(auth.middleware(app));
  app.use(app.router);
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  } else {
    app.use(function (err, req, res) {
      console.error(err.stack);
      res.send(500, 'Something\'s broke!');
    });
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
  async.apply(async.parallel, Object.keys(secrets).map(function (name) {
    return makeupSecret.bind(null, name);
  })),
  startServer
]);