module.exports = isUser;

function isUser(req, res, next) {
  if (req.user && req.loggedIn) {
    next();
  } else {
    req.session.authRedirect = req.url;
    res.redirect('/auth/github');
  }
}