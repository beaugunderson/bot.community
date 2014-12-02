/*global $:true*/

'use strict';

$(function () {
  $('#bot-search').select2({
    placeholder: 'Find a bot',
    minimumInputLength: 1,
    id: function (result) {
      return result.value;
    },
    ajax: {
      url: function (query) {
        return '/autocomplete/' + query + '/';
      },
      dataType: 'json',
      results: function (data) {
        return {results: data.splice(0, 15)};
      },
      cache: true
    },
    formatResult: function (result) {
      return result.value;
    },
    formatSelection: function (result) {
      return result.value;
    }
  });

  $('#bot-search').on('change', function (e) {
    location.href = '/bots/' + e.val + '/';
  });
});
