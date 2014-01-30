
module.exports = function (app) {
  app.get('/', index);
};

/*
 * GET home page.
 */
function index(req, res) {
  res.render('index');
}