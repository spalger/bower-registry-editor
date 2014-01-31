var oauth;

if (!process.env.GITHUB_API_ID || !process.env.GITHUB_API_SECRET) {
  throw new Error('missing github api credentials.');
}

function setup(host) {
  oauth = require('github-oauth')({
    githubClient: process.env.GITHUB_API_ID,
    githubSecret: process.env.GITHUB_API_SECRET,
    baseURL: host,
    loginURI: '/auth/github',
    callbackURI: '/auth/github/callback',
    scope: ' ' // optional, default scope is set to user
  });

  oauth.on('error', function (err) {
    console.error('login error', err);
  });

  oauth.on('token', function (token, res) {
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

  return oauth;
}

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
    if (!oauth) oauth = setup(req.protocol + '://' + req.get('host'));
    if (req.session && req.session.user) {
      redirect(res, res);
    }

    return oauth.login(req, res);
  });

  app.get('/auth/github/callback', function (req, res) {
    if (!oauth) oauth = setup(req.protocol + '://' + req.get('host'));
    return oauth.callback(req, res);
  });
};