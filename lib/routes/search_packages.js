module.exports = function (app) {
  app.get('/search', searchForPackage);
  app.post('/search', searchForPackage);
};

var registry = require('../registry');
var gitUrl = require('../git_url');
var _ = require('lodash');

function searchForPackage(req, res, next) {
  var query = req.param('q');
  if (!query) return res.redirect('/');

  registry.search(query, function (err, results) {
    if (err) return next(err);

    results = _.map(results || [], function (result) {
      return {
        name: result.name,
        url: gitUrl.toGitHub(result.url)
      };
    }).filter(Boolean);

    if (req.xhr) {
      res.json(results);
    } else {
      res.render('index', { results: results, query: query });
    }
  });
}