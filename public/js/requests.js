(function () {
  /* global _, $, window, alert */
  var requestHtml = _.template($('#request-template').html());
  var $list = $('#requests');
  var $save = $('#requests-save');

  $.getJSON('/requests')
    .then(function (requests) {
      $list.html('');

      if (requests.length) {
        _(requests).sortBy('time').each(function (request) {
          $list.append(requestHtml(request));
        });
      } else {
        $list.html('<pre>No pending requests</pre>')
      }
    }, ajaxError);

  var complete = [];

  $list.on('change', ':checkbox', function () {
    if (this.checked) {
      complete.push(this.name);
    } else {
      complete = _.without(complete, this.name);
    }

    if (complete.length) {
      $save.removeAttr('disabled');
    } else {
      $save.attr('disabled', 'disabled');
    }
  });

  $save.on('click', function (e) {
    e.preventDefault();
    $(this).attr('disabled', 'disabled');

    $.ajax({
      data: JSON.stringify({ repo_names: complete }),
      contentType: 'application/json',
      method: 'DELETE'
    })
    .then(function () {
      window.location.reload();
    }, ajaxError);
  });

  function ajaxError(xhr) {
    alert('AJAX ERROR: ' + (xhr.responseText || 'Unknown error'));
  }

}());