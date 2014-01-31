var isUser = require('./is_user');
var isCollab = require('./is_collab');
var isEditor = require('./is_editor');

module.exports = {
  check: isUser,
  checkCollab: [
    isUser,
    isCollab,
  ],
  checkEditor: [
    isUser,
    isEditor
  ]
};