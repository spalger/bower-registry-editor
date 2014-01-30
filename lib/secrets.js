var secrets = module.exports = {};
var path = require('path');
var async = require('async');
var crypto = require('crypto');
var fs = require('fs');

secrets.init = function (done) {
  async.series([
    async.apply(makeupSecret, 'cookie'),
    async.apply(makeupSecret, 'session'),
    keepSecrets
  ], done);
};

function makeupSecret(name, done) {
  var envName = name.toUpperCase() + '_SECRET', buf;
  if (process.env[envName]) {
    buf = new Buffer(process.env[envName], 'base64');
    secrets[name] = buf.toString('utf8');
    return process.nextTick(done);
  }

  crypto.randomBytes(256, function (err, buf) {
    if (err) return done(err);
    secrets[name] = buf.toString('utf8');
    return done();
  });
}

function keepSecrets(done) {
  var env = require('../env'), buf;

  buf = new Buffer(secrets.cookie, 'utf8');
  env.COOKIE_SECRET = buf.toString('base64');

  buf = new Buffer(secrets.session, 'utf8');
  env.SESSION_SECRET = buf.toString('base64');

  fs.writeFile(path.resolve(__dirname, '../env.json'), JSON.stringify(env, null, '  '), done);
}