module.exports = LruSessionStore;

var express = require('express');
var _ = require('lodash');
var util = require('util');

var root = require('path').resolve(__dirname, '..');
var oneDay = 1000 * 60 * 60 * 24;

var wrapped = _.transform('get set del'.split(' '), function (wrapped, name) {
  wrapped[name] = function (key, val, done) {
    // juggle get/set
    if (typeof val === 'function') {
      done = val;
      val = void 0;
    }

    if (typeof done !== 'function') done = _.noop;

    if (name === 'set') {
      // set ops don't have to be complete
      val = _.assign(this._cache.get(key) || {}, val);
    }

    process.nextTick(this.bind(function () {
      var ret, err;
      try {
        ret = this._cache[name](key, val);
      } catch (e) {
        err = e;
        ret = void 0;
      }

      console.log(name, key + ' -> ', (ret || err));
      done(err, ret);
    }));

    // replication to leveldb
    if (name !== 'get') {
      var op = { type: name, key: key };

      if (name === 'set') {
        op.type = 'put';
        op.value = val;
      }

      this._transLog.push(op);

      // write every 100 ops
      if (this._transLog.length >= 100) this._replicate();
    }
  };
}, {});


function LruSessionStore() {
  this.get = wrapped.get;
  this.set = wrapped.set;
  this.destroy = wrapped.del;
  this.bind = function (fn) {
    return _.bind(fn, this);
  };

  var db = require('levelup')(root + '/session.db', {
    cacheSize: 0,
    keyEncoding: 'utf8',
    valueEncoding: 'json'
  });

  this._cache = require('lru-cache')({
    max: 5000,
    maxAge: oneDay
  });

  this._opCount = 0;
  this._transLog = [];

  var str = db.createReadStream()
    .on('data', this.bind(function (data) {
      // console.log('restore', data.key, '\n', data.value);
      this._cache.set(data.key, data.value);
    }))
    .on('error', function (err) {
      console.log('Unable to restore persisted sessions:', err.message);
    })
    .on('end', function () {
      str.removeAllListeners();
      console.log('Restored sessions.');
    });

  'SIGHUP SIGTERM SIGINT'.split(' ').forEach(this.bind(function (event) {
    process.on(event, this.bind(function (signal) {
      console.log('got', event);
      this._replicate(function () {
        process.exit(signal || 0);
      });
    }));
  }));

  this._replicate = function (done) {
    if (this._replicationInProgress) {
      return;
    }

    var ops = this._transLog.slice(0);
    var opts = {};

    console.log('Persisting %d session ops to disk', ops.length);
    console.log(ops);

    this._replicationInProgress = true;
    db.batch(ops, opts, this.bind(function onDone(err) {
      this._replicationInProgress = false;

      if (err) {
        console.error('Unable to persist sessions.');
        console.error(err.stack);
      } else {
        this._transLog = this._transLog.slice(ops.length);
      }

      if (this._transLog.length >= 100) {
        setTimeout(_.bindKey(this, '_replicate', done), err ? 15000 : 0);
      } else if (typeof done === 'function') {
        done();
      }
    }));
  };
}

util.inherits(LruSessionStore, express.session.Store);