var levelup = require('levelup');

module.exports = levelup(
  require('path').resolve(__dirname, '../request.db'),// location
  {
    keyEncoding   : 'utf8',
    valueEncoding : 'utf8'
  }
);