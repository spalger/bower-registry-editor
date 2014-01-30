var everyauth = require('everyauth');
var LRU = require('lru-cache');
var users = LRU({
  max: 500,
  maxAge: 1000 * 60 * 60 * 24
});

module.exports = function (/*app */) {
  everyauth.everymodule
    .findUserById(function (userId, callback) {
      process.nextTick(function () {
        var err, user;
        try {
          user = users.get(userId);
        } catch (e) {
          err = e;
          user = void 0;
        }
        callback(err, user);
      });
    });

  everyauth.github
    .appId(process.env.GITHUB_API_ID)
    .appSecret(process.env.GITHUB_API_SECRET)
    .redirectPath('/')
    .findOrCreateUser(function (sess, accessToken, accessTokenExtra, ghUser) {
      var user = users.get(ghUser.id);
      if (!user) {
        user = {
          id: ghUser.id,
          login: ghUser.login,
          avatar: ghUser.avatar_url
        };
        users.set(ghUser.id, user);
      }

      return user;
    });

  return everyauth.middleware();
};