var fs = require('fs');
var root = require('path').resolve(__dirname, '..');
var stream = fs.createWriteStream(root + '/public/complete_log.txt', {
  flags: 'a',
  encoding: 'urf8',
  mode: 0666
});

exports.append = function (name) {
  var time = new Date();
  if (name && typeof name !== 'string') {
    name = name.name;
  }
  stream.write(name + ' - ' + time.toLocaleDateString() + '\n', 'utf8');
};