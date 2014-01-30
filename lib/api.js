var headers = {
  'User-Agent': 'spenceralger/bower-unregistry',
  'Accept': 'application/json'
};

var request = require('request');

exports.get = function (path, cb) {
  request({
    url: 'https://api.github.com' + path,
    headers: headers,
    maxSockets: 100
  }, cb);
};