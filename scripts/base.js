'use strict'
// This module provides helpers for Boston.gov
// ---------------------------
var Boston = (function () {
  // Returns the child element based on selector
  // Parent needs an ID
  function child(el, selector) {
    return document.querySelectorAll('#' + el.id + ' ' + selector);
  }

  // Returns the child element based on selector
  // Parent needs a selector
  function childByEl(parent, selector) {
    return parent.getElementsByClassName(selector);
  }

  function request(obj) {
    var request = new XMLHttpRequest();
    request.open(obj.method, obj.url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        obj.success(request);
      } else {
        obj.error(request);
      }
    };

    request.onerror = function() {
      obj.error(request);
    };

    if (obj.data) {
      request.send(obj.data);
    } else {
      request.send();
    }
  }

  return {
    request: request,
    child: child,
    childByEl: childByEl
  }
})();
