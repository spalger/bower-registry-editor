module.exports = LruSessionStore;

var express = require('express');
var _ = require('lodash');
var util = require('util');

var oneDay = 1000 * 60 * 60 * 24;

var sessions = require('lru-cache')({
  max: 5000,
  maxAge: oneDay
});

var wrapped = _.transform('get set del'.split(' '), function (wrapped, name) {
  wrapped[name] = function (key, val, done) {
    // juggle get/set
    if (typeof val === 'function') {
      done = val;
      val = void 0;
    }

    process.nextTick(function () {
      var ret, err;
      try {
        ret = sessions[name](key, val);
      } catch (e) {
        err = e;
        ret = void 0;
      }
      done(err, ret);
    });
  };
}, {});


function LruSessionStore() {
  this.get = wrapped.get;
  this.set = wrapped.set;
  this.destroy = wrapped.del;
}

util.inherits(LruSessionStore, express.session.Store);