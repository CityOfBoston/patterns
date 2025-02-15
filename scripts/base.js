'use strict'
// This module provides helpers for Boston.gov
// ---------------------------

var Boston = (function () {
  // Regular expressions for email and zip validation
  var emailRE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var zipRE = /(^\d{5}$)|(^\d{5}-\d{4}$)/;

  // Returns all child elements of a parent element based on selector
  // Parent element should have an ID
  function child(el, selector) {
    return document.querySelectorAll('#' + el.id + ' ' + selector);
  }

  // Returns child elements by class name within a given parent element
  function childByEl(parent, selector) {
    return parent.getElementsByClassName(selector);
  }

  // Disables button(s) inside the given form and updates its label
  // `form`: The form element containing the button(s)
  // `label`: The new label to set for the button(s)
  function disableButton(form, label) {
    var button = Boston.childByEl(form, 'btn');
    
    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = true;
        button[i].innerHTML = label;
      }
    }
  }

  // Enables button(s) inside the given form and updates its label
  // `form`: The form element containing the button(s)
  // `label`: The new label to set for the button(s)
  function enableButton(form, label) {
    var button = Boston.childByEl(form, 'btn');

    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = false;
        button[i].innerHTML = label;
      }
    }
  }

  // Checks if the element has a specific class
  // `element`: The DOM element to check
  // `cls`: The class name to check for
  function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
  }

  // Invalidates the field by appending an error message
  // `field`: The field to invalidate (should be an input or textarea element)
  // `message`: The error message to display
  function invalidateField(field, message) {
    // Remove existing error messages before appending new ones
    var existingErrors = field.parentElement.querySelectorAll('.t--err');
    existingErrors.forEach(function (err) {
      err.remove();
    });

    // Create a new error message div
    var errors = document.createElement('div');
    errors.className = "t--subinfo t--err m-t100";
    errors.innerHTML = message;
    field.parentElement.appendChild(errors);
  }

  // Sends an HTTP request with error handling and optional token authorization
  // `obj`: An object containing:
  //   - `method`: HTTP method (GET, POST, etc.)
  //   - `url`: The endpoint URL
  //   - `data`: The data to send (optional)
  //   - `success`: A function to handle a successful response
  //   - `error`: A function to handle an error response
  // `token`: The optional authorization token
  function request(obj, token) {
    var request = new XMLHttpRequest();
    request.open(obj.method, obj.url, true);

    // Response handler
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        obj.success(request);
      } else {
        obj.error(request);
      }
    };

    // Set the Authorization header if a token is provided
    if (token) {
      request.setRequestHeader("Authorization", "Token " + token);
    }

    // Handle network errors
    request.onerror = function() {
      obj.error(request);
    };

    // Handle data and ensure JSON data is stringified if present
    if (obj.data) {
      if (typeof obj.data === 'object') {
        obj.data = JSON.stringify(obj.data);  // Ensure JSON data is stringified
      }
      request.setRequestHeader("Content-Type", "application/json"); // Set content type to JSON
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
