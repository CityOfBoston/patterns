'use strict'
// This module controls the City of Boston newsletter component
// ---------------------------
var BostonHeader = (function () {
  var guideTitle;
  var headerGuideTitle;
  var header;
  var searchIcon;

  function handleGuideTitleTrigger(show) {
    if (show) {
      headerGuideTitle.classList.add('h-gt--active');
    } else {
      headerGuideTitle.classList.remove('h-gt--active');
    }
  }

  function setupGuideTitle() {
    headerGuideTitle = document.createElement('div');

    headerGuideTitle.className = 'h-gt';
    headerGuideTitle.innerHTML = guideTitle.innerHTML;

    header.appendChild(headerGuideTitle);
  }

  function setupSearchIcon() {
    if (!searchIcon.addEventListener || !document.querySelector) {
      return;
    }

    searchIcon.addEventListener('click', function() {
      var searchField = document.querySelector('.sf-i-f');

      if (searchField) {
        // setTimeout so that the search box appears via the CSS before we focus
        // it.
        window.setTimeout(function() {
          searchField.focus();
        }, 0);
      }
    })

    searchIcon.addEventListener('keydown', function(e) {
      e.stopImmediatePropagation();

      if (e.keyCode == 13) {
        this.click();
      }
    })

  }

  function start() {
    guideTitle = document.getElementById('topicTitle');
    header = document.getElementById('main-menu');

    if (document.querySelector) {
      // The search icon in the header is the label that controls this checkbox,
      // which in turn makes the search field hide/show via CSS.
      searchIcon = document.querySelector('label[for="s-tr"]');
    }

    if (guideTitle) {
      setupGuideTitle();
    }

    if (searchIcon) {
      setupSearchIcon();
    }
  }

  return {
    start: start,
    handleGuideTitleTrigger: handleGuideTitleTrigger
  }
})();

BostonHeader.start();

