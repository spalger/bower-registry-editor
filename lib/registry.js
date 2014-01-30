var temp = require('temp');
var RegistryClient = require('bower-registry-client');

temp.track();

module.exports = new RegistryClient({
  cache: temp.mkdirSync(),
  timeout: 20000
});