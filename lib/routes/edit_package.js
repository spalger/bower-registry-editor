module.exports = function (app) {
  app.get('/package/:repo_name(*)', editAPackage);
  app['delete']('/package/:repo_name(*)', deleteAPackage);
};

var requestDb = require('../request_db');
var auth = require('../auth/middleware');
var _ = require('lodash');

var editAPackage = [
  auth.checkCollab,
  function (req, res, next) {
    requestDb.get(req.param('repo_name'), function (err, value) {
      if (err && !err.notFound) return next(err);

      if (value) {
        req.pack.delete_requested = true;
      }

      next();
    });
  },
  function (req, res) {
    res.render('edit', {
      pack: req.pack
    });
  }
];

var deleteAPackage = [
  auth.checkCollab,
  function (req, res, next) {
    var request = _.clone(req.pack);
    request.time = Date.now();

    requestDb.put(req.param('repo_name'), JSON.stringify(request), next);
  },
  function (req, res/*, next*/) {
    res.send(200);
  }
];