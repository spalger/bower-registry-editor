var RE_repo = /^.*?github\.com[:\/]([^\/]+)\/([^\/.]+)(?:\.git)?/;

function parse(url) {
  try {
    var m = RE_repo.exec(url);
    return {
      user: m[1],
      name: m[2]
    };
  } catch (err) {
    // ignore
  }
}

function toGitHub(url) {
  var repo = parse(url);
  if (repo) {
    return 'https://github.com/' + repo.user + '/' + repo.name;
  }
}

module.exports = {
  parse: parse,
  toGitHub: toGitHub
};