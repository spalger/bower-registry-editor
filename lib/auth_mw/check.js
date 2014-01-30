module.exports = function check(req, res, next) {
  if (req.user && req.loggedIn) {
    next();
  } else {
    res.redirect('/auth/github');
  }
};