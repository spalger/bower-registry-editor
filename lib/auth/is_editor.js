module.exports = isEditor;

var api = require('../api');

function isEditor(req, res, next) {
  if (req.user.login === 'spenceralger') return next();

  api.get('/repos/bower/bower/collaborators/' + req.user.login, function (err, apiResponse) {
    if (err) return next(err);
    switch (apiResponse.statusCode) {
    case 204:
      return next();
    case 404:
      return res.text(401, 'You are not an authorized to manage requests');
    default:
      return next(new Error('Error communicating with Github'));
    }
  });
}