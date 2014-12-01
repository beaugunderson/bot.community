/*global $:true Bloodhound:true*/

'use strict';

$(function () {
  var bots = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    // prefetch: '../data/films/post_1960.json',
    remote: '/bots/search/%QUERY'
  });

  bots.initialize();

  $('#bot-search .typeahead').typeahead(null, {
    name: 'bots',
    displayKey: 'value',
    source: bots.ttAdapter()
  });
});
