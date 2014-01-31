module.exports = isCollaborator;

var api = require('../api');
var registry = require('../registry');
var gitUrl = require('../git_url');

function isCollaborator(req, res, next) {
  var name = req.param('repo_name');

  if (!name) return res.text(400, 'Missing repo name');

  registry.lookup(name, function (err, pack) {
    if (err) return next(err);
    if (!pack || !pack.url) return res.text(400, 'Invalid package name');

    // rewrite pack to include the name
    pack = req.pack = {
      name: name,
      url: pack.url
    };

    var repo = gitUrl.parse(pack.url);
    if (!repo) return res.text(400, 'Unable to parse repo url');

    api.get('/repos/' + repo.user + '/' + repo.name + '/collaborators/' + req.user.login, function (err, apiResponse) {
      if (err) return next(err);
      switch (apiResponse.statusCode) {
      case 204:
        return next();
      case 404:
        return res.text(401, 'You are not authorized to edit ' + name);
      default:
        return next(new Error('Error communicating with Github'));
      }
    });
  });
}