'use strict'
// This module controls the City of Boston newsletter component
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
        Boston.disableButton(form, 'Loading...');

        Boston.request({
          data: formData,
          url: form.getAttribute('action'),
          method: 'POST',
          success: function (response) {
            var response = JSON.parse(response.response);

            if (response.subscriber) {
              form.parentElement.innerHTML = "<div class='t--info'>If this is the first time you've subscribed to a City of Boston newsletter, you'll see a confirmation email in your inbox to confirm your subscription. If you don't see that email, be sure to check your spam and junk folders.</div>";
            } else {
              handleError();
            }
          },
          error: function() {
            Boston.enableButton(form, 'Sign up')
            handleError();
          }
        });
      }
    });
  }

  function handleError(form) {
    resetForm(form);
  }

  function validateForm(form) {
    var email = Boston.childByEl(form, 'bos-newsletter-email');
    var zip = Boston.childByEl(form, 'bos-newsletter-zip');
    var valid = true;

    if (email[0].value == '' || !Boston.emailRE.test(email[0].value)) {
      var errors = document.createElement('div');
      errors.className = "t--subinfo t--err m-t100";
      errors.innerHTML = "Please enter a valid email address";
      email[0].parentElement.appendChild(errors);
      valid = false;
    }

    if (zip[0].value !== '' && !Boston.zipRE.test(zip[0].value)) {
      var errors = document.createElement('div');
      errors.className = "t--subinfo t--err m-t100";
      errors.innerHTML = "Please enter a valid zip code";
      zip[0].parentElement.appendChild(errors);
      valid = false;
    }

    return valid;
  }

  function resetForm(form) {
    var errors = Boston.childByEl(form, 't--err');

    for (var i = 0; i < errors.length; i++) {
      errors[i].remove();
      i--;
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
