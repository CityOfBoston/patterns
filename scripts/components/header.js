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

  function start() {
    guideTitle = document.getElementById('topicTitle');
    header = document.getElementById('main-menu');

    if (guideTitle) {
      setupGuideTitle();
    }
  }

  return {
    start: start,
    handleGuideTitleTrigger: handleGuideTitleTrigger
  }
})();

BostonHeader.start();
