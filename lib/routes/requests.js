module.exports = function (app) {
  app.get('/requests', displayRequests);
  app['delete']('/requests/:repo_name?', deleteRequest);
};

var requestDb = require('../request_db');
var auth = require('../auth/middleware');
var _ = require('lodash');
var completeLog = require('../complete_log');

var displayRequests = [
  auth.checkEditor,
  function (req, res, next) {
    if (req.xhr || !req.accepts('html')) {
      return next();
    }

    res.render('requests');
  },
  function (req, res, next) {
    // stream request objects
    res.set('Content-Type', 'application/json');
    res.write('[');
    var i = 0;
    requestDb.createReadStream()
      .on('data', function (data) {
        res.write((i++ ? ',' : '') + data.value);
      })
      .on('error', function (err) {
        next(err);
      })
      .on('end', function () {
        res.write(']');
        res.end();
      });
  }
];

var deleteRequest = [
  auth.checkEditor,
  function (req, res, next) {
    var name = req.param('repo_name');
    var names = req.param('repo_names', []);

    if (!_.isArray(names)) {
      return res.send(400, 'Expected repo_names to be an array');
    }

    if (name) names.push(name);

    if (names.length === 0) {
      return res.send(400, 'You need to specify the repo name as a part of the URL (DELETE /requests/:repo_name)');
    }

    var batch = requestDb.batch();
    _.each(names, _.bindKey(batch, 'del'));

    batch.write(function (err) {
      if (err) return next(err);

      _.each(names, completeLog.append);
      res.send(200);
    });
  }
];