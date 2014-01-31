var defaultHeaders = {
  'User-Agent': 'spenceralger/bower-unregistry',
  'Accept': 'application/json'
};

var _ = require('lodash');
var request = require('request');
var LRU = require('lru-cache');
var apiCache = new LRU({
  max: 100,
  maxAge: 1000 * 90
});


exports.get = function (path, token, cb) {
  if (typeof token === 'function') {
    cb = token, token = null;
  }

  var headers = defaultHeaders;

  if (token) {
    headers = _.assign({}, headers, {
      'Authorization': 'token ' + token
    });
  } else {
    var cachedResp = apiCache.get(path);
    if (cachedResp) {
      process.nextTick(function () {
        cb.apply(null, cachedResp);
      });
      return;
    }
  }

  request({
    url: 'https://api.github.com' + path,
    headers: headers,
    maxSockets: 100,
    json: true
  }, function (err, resp, body) {
    if (!err && !token) {
      apiCache.set(path, [err, resp, body]);
    }
    cb(err, resp, body);
  });
};