'use strict'
// This module controls the City of Boston video component
// ---------------------------
var BostonNewsletter = (function () {
  function initForm(form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

      // Reset the form
      resetForm(form);

      // Test the form for valid
      var isValid = validateForm(form);
      var formData = new FormData(form);

      if (isValid) {
        disableButton(form);

        Boston.request({
          data: formData,
          url: form.getAttribute('action'),
          method: 'POST',
          success: function (response) {
            var response = JSON.parse(response.response);

            if (response.subscriber) {
              form.parentElement.innerHTML = "<div class='t--info'>Great. You'll get your first email soon.</div>";
            } else {
              handleError();
            }
          },
          error: function() {
            enableButton(form)
            handleError();
          }
        });
      }
    });
  }

  function disableButton(form) {
    var button = Boston.childByEl(form, 'btn');

    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = true;
        button[i].innerHTML = 'Loading...';
      }
    }
  }

  function enableButton(form) {
    var button = Boston.childByEl(form, 'btn');

    if (button.length > 0) {
      for (var i = 0; i < button.length; i++) {
        button[i].disabled = false;
        button[i].innerHTML = 'Sign Up';
      }
    }
  }

  function handleError() {

  }

  function validateForm(form) {
    var email = Boston.childByEl(form, 'bos-newsletter-email');
    var zip = Boston.childByEl(form, 'bos-newsletter-zip');

    var emailRE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var zipRE = /(^\d{5}$)|(^\d{5}-\d{4}$)/;

    if (email[0].value == '' || !emailRE.test(email[0].value)) {
      var errors = document.createElement('div');
      errors.className = "t--subinfo t--err m-t100";
      errors.innerHTML = "Please enter a valid email address";
      email[0].parentElement.appendChild(errors);
      return false;
    }

    if (zip[0].value !== '' && !zipRE.test(zip[0].value)) {
      var errors = document.createElement('div');
      errors.className = "t--subinfo t--err m-t100";
      errors.innerHTML = "Please enter a valid zip code";
      zip[0].parentElement.appendChild(errors);
      return false;
    }

    return true;
  }

  function resetForm(form) {
    var errors = Boston.childByEl(form, 't--err');

    for (var i = 0; i < errors.length; i++) {
      errors[i].remove();
    }
  }

  function start() {
    var forms = document.querySelectorAll('.bos-newsletter');

    if (forms.length > 0) {
      for (var i = 0; i < forms.length; i++) {
        initForm(forms[i]);
      }
    }
  }

  return {
    start: start
  }
})();

BostonNewsletter.start();
