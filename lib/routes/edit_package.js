module.exports = function (app) {
  app.get('/package/:repo_name(*)', editAPackage);
  app['delete']('/package/:repo_name(*)', deleteAPackage);
};

var auth = require('../auth_mw');

var editAPackage = [
  auth.checkCollab,
  function (req, res) {
    res.render('edit', {
      pack: req.pack
    });
  }
];

var deleteAPackage = [
  auth.checkCollab,
  function (req, res) {
    res.text(400, 'not implemented');
  }
];