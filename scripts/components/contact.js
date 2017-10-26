'use strict'
// This module controls the City of Boston video component
// ---------------------------
var BostonContact = (function () {
  var to_address;

  function initEmailLink(emailLink) {
    // Handle the onclick event
    emailLink.addEventListener('click', handleEmailClick);
  }

  function handleEmailClick(ev) {
    ev.preventDefault();

    if (document.getElementById('contactFormTemplate')) {
      document.body.classList.add('no-s');

      var template = document.getElementById('contactFormTemplate');
      var container = document.createElement('div');

      container.id = "contactFormModal";
      container.innerHTML = template.innerHTML;

      document.body.appendChild(container);

      if (ev.target.title && ev.target.title !== '') {
        document.getElementById('contactMessage').innerHTML = ev.target.title;
      }

      var close = Boston.childByEl(container, 'md-cb');
      close[0].addEventListener('click', handleEmailClose);

      var form = document.getElementById('contactForm');
      form.addEventListener('submit', handleFormSubmit);

      // Set the hidden fields
      setBrowser(ev.target);
      setURL(ev.target);
      setToAddress(ev.target);
    }
  }

  function handleEmailClose(ev) {
    ev.preventDefault();
    document.body.classList.remove('no-s');
    document.getElementById('contactFormModal').remove();
  }

  function handleFormSubmit(ev) {
    ev.preventDefault();

    var form = document.getElementById('contactForm');
    var isValid = validateForm(form);
    var formData = new FormData(form);

    if (isValid) {
      Boston.disableButton(form, 'Loading...');

      Boston.request({
        data: formData,
        url: form.getAttribute('action'),
        method: 'POST',
        success: function (response) {
          if (response.status === 200) {
            form.parentElement.innerHTML = "<p>Thank you for contacting us. We appreciate your interest in the City. If you don’t hear from anyone within five business days, please contact BOS:311 at 3-1-1 or 617-635-4500.</p>";
          } else {
            handleError(form);
          }
        },
        error: function() {
          handleError(form);
        }
      }, "c43517a240ee61898c00600eaa775aa0d0e639322c3f275b780f66062f69");
    }
  }

  function handleError(form) {
    Boston.enableButton(form, 'Send Message');
  }

  function validateForm(form) {
    var email = Boston.childByEl(form, 'bos-contact-email');
    var name = Boston.childByEl(form, 'bos-contact-name');
    var subject = Boston.childByEl(form, 'bos-contact-subject');
    var message = Boston.childByEl(form, 'bos-contact-message');
    var address_to = document.getElementById('contactFormToAddress');
    var valid = true;

    if (email[0].value == '' || !Boston.emailRE.test(email[0].value)) {
      Boston.invalidateField(email[0], "Please enter a valid email address");
      valid = false;
    }

    if (name[0].value == '') {
      Boston.invalidateField(name[0], "Please enter your full name");
      valid = false;
    }

    if (subject[0].value == '') {
      Boston.invalidateField(subject[0], "Please enter a subject");
      valid = false;
    }

    if (message[0].value == '') {
      Boston.invalidateField(message[0], "Please enter a message");
      valid = false;
    }

    if (address_to.value !== to_address) {
      valid = false;
    }

    return valid;
  }

  function setBrowser(link) {
    var browserField = document.getElementById('contactFormBrowser');
    browserField.value = navigator.userAgent;
  }

  function setToAddress(link) {
    var toField = document.getElementById('contactFormToAddress');
    toField.value = link.getAttribute('href').replace('mailto:', '');
    to_address = link.getAttribute('href').replace('mailto:', '');
  }

  function setURL(link) {
    var urlField = document.getElementById('contactFormURL');
    urlField.value = window.location.href;
  }

  function start() {
    // The page needs to include a template with id of contactMessage
    if (document.getElementById('contactFormTemplate')) {
      var emailLinks = document.querySelectorAll('a[href^=mailto]:not(.hide-form)');

      if (emailLinks.length > 0) {
        for (var i = 0; i < emailLinks.length; i++) {
          initEmailLink(emailLinks[i]);
        }
      }
    }
  }

  return {
    start: start,
    close: handleEmailClose
  }
})();

BostonContact.start();
