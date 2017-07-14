'use strict'
// This module provides helpers for Boston.gov
// ---------------------------
var Boston = (function () {
  var emailRE = /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/;
  var zipRE = /(^\d{5}$)|(^\d{5}-\d{4}$)/;

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

  function disableButton(form, label) {
    var button = Boston.childByEl(form, 'btn');

    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = true;
        button[i].innerHTML = label;
      }
    }
  }

  function enableButton(form, label) {
    var button = Boston.childByEl(form, 'btn');

    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = false;
        button[i].innerHTML = label;
      }
    }
  }

  function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }

  function invalidateField(field, message) {
    var errors = document.createElement('div');
    errors.className = "t--subinfo t--err m-t100";
    errors.innerHTML = message;
    field.parentElement.appendChild(errors);
  }

  function request(obj, token) {
    var request = new XMLHttpRequest();
    request.open(obj.method, obj.url, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        obj.success(request);
      } else {
        obj.error(request);
      }
    };

    if (token) {
      request.setRequestHeader("Authorization", "Token " + token);
    }

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
    childByEl: childByEl,
    disableButton: disableButton,
    enableButton: enableButton,
    emailRE: emailRE,
    hasClass: hasClass,
    invalidateField: invalidateField,
    zipRE: zipRE
  }
})();
