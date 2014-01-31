var githubOAuth = require('github-oauth')({
  githubClient: process.env.GITHUB_API_ID,
  githubSecret: process.env.GITHUB_API_SECRET,
  baseURL: 'http://localhost:3000',
  loginURI: '/auth/github',
  callbackURI: '/auth/github/callback',
  scope: ' ' // optional, default scope is set to user
});

var api = require('../api');

function redirect(req, res) {
  if (req.session && req.session.authRedirect) {
    res.redirect(req.session.authRedirect);
    delete req.session.authRedirect;
  } else {
    res.redirect('/');
  }
}

module.exports = function (app) {

  app.get('/auth/github', function (req, res) {
    if (req.session && req.session.user) {
      redirect(res, res);
    }

    return githubOAuth.login(req, res);
  });

  app.get('/auth/github/callback', function (req, res) {
    return githubOAuth.callback(req, res);
  });

  githubOAuth.on('token', function (token, res) {
    api.get('/user', token.access_token, function (err, apiRes, user) {
      var req = res.req;

      req.session.user = {
        avatar: user.avatar_url,
        login: user.login,
        id: user.id
      };
      req.loggedIn = true;
      redirect(req, res);
    });
  });
};