var headers = {
  'User-Agent': 'spenceralger/bower-unregistry',
  'Accept': 'application/json'
};

var request = require('request');
var LRU = require('lru-cache');
var apiCache = new LRU({
  max: 100,
  maxAge: 1000 * 90
});


exports.get = function (path, cb) {
  var cachedResp = apiCache.get(path);
  if (cachedResp) {
    process.nextTick(function () {
      cb.apply(null, cachedResp);
    });
    return;
  }

  request({
    url: 'https://api.github.com' + path,
    headers: headers,
    maxSockets: 100
  }, function (err, resp, body) {
    if (!err) {
      apiCache.set(path, [err, resp, body]);
    }
    cb(err, resp, body);
  });
};