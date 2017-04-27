'use strict'
// This module provides helpers for Boston.gov
// ---------------------------
var Boston = (function () {
  // Set height
  var trigger;
  var container;
  var video_id;
  var video_channel;

  // Returns the child element based on selector
  // Parent needs an ID
  function child(el, selector) {
    return document.querySelectorAll('#' + el.id + ' ' + selector);
  }

  return {
    child: child
  }
})();
