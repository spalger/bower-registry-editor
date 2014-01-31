module.exports = isUser;

function isUser(req, res, next) {
  if (req.user && req.loggedIn) {
    next();
  } else {
    res.redirect('/auth/github');
  }
}