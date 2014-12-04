/*global $:true isAuthenticated:true*/

'use strict';

var ENTER_KEY = 13;

function buildForm(key, value) {
  var $key = $('<dt/>');
  var $value = $('<dd/>');

  var $keyInput = $('<input type="text" class="key" placeholder="key">');
  var $valueInput = $('<input type="text" class="value" placeholder="value">');

  if (key) {
    $keyInput.val(key);
  }

  if (value) {
    $valueInput.val(value);
  }

  $key.append($keyInput);
  $value.append($valueInput);

  return [$key, $value];
}

$(function () {
  if (!isAuthenticated) {
    return;
  }

  var thisBot = $('.bot-detail').data('bot');

  $('.report a').click(function (event) {
    event.preventDefault();

    $.post($(this).attr('href'), {}, function () {
      $('.report').text('Thanks for reporting!');
    });
  });

  $('.add-tag').click(function () {
    var $form = $('<form/>').append(buildForm());

    $(this).parent().before($form);
  });

  $('.tags').on('click', 'dt.tag, dd.tag', function () {
    var key = $(this).parents('form').find('dt').text();
    var value = $(this).parents('form').find('dd').text();

    // TODO: set focus after adding inputs
    $(this).parents('form').html('').append(buildForm(key, value));
  });

  $('.tags').on('keydown', 'input', function (event) {
    if (event.which !== ENTER_KEY) {
      return;
    }

    var $form = $(this).parents('form');

    var tag = {
      key: $form.find('.key').val(),
      value: $form.find('.value').val()
    };

    var self = this;

    function updateForm(tag) {
      $(self).parents('form').html('<dt class="tag">' + tag.key + '</dt>' +
                                   '<dd class="tag">' + tag.value + '</dd>');
    }

    if ($form.data('id')) {
      $.post('/bots/' + thisBot + '/tags/' + $form.data('id') + '/',
             tag, updateForm);
    } else {
      $.post('/bots/' + thisBot + '/tags/', tag, updateForm);
    }
  });
});
