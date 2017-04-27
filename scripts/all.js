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

'use strict'
// This module controls the City of Boston seal
// ---------------------------
// On scroll, the seal will hide or show depending on the
// position of the page.
var BostonSeal = (function () {
  // Set height
  var elHeight = 245;

  // A place for some debounce
  var timerEl;

  // Get the seal
  var theSeal = document.querySelectorAll('.s')

  // Check for topic titles
  var isTopic = document.querySelectorAll('.node-type-topic-page').length > 0

  function scrolling() {
    // Let's not do anything if we're still scrolling
    if (timerEl) {
      clearTimeout(timerEl);
    }

    // Trigger event, if we're not scrolling anymore
    timerEl = setTimeout(processScroll, 75);
  }

  function processScroll() {
    // Contains the position of the window.
    var scrollPos = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    // Figure out which class to use
    var className  = isTopic ? 's--h' : 's--u'

    if (scrollPos > elHeight) {
      // Add the class
      theSeal[0].classList.add(className)

      if (isTopic) {
        // Create the event.
        var event = document.createEvent('Event');

        // Define that the event name is 'build'.
        event.initEvent('seal:hidden', true, true);

        // Fire an event to tell the world about the seal
        document.body.dispatchEvent(event)
      }
    } else {
      // Add the class
      theSeal[0].classList.remove(className)

      if (isTopic) {
        // Create the event.
        var event = document.createEvent('Event');

        // Define that the event name is 'build'.
        event.initEvent('seal:down', true, true);

        // Fire an event to tell the world about the seal
        document.body.dispatchEvent(event)
      }
    }
  }

  function start() {
    // Make sure the seal exists, or punt
    if (theSeal.length > 0 && theSeal[0]) {
      // If we scroll the page, trigger event
      window.addEventListener('scroll', scrolling);

      // Trigger it here, just once
      scrolling();
    }
  }

  return {
    start: start
  }
})()

BostonSeal.start()

'use strict'
// This module controls the City of Boston tabs
// ---------------------------
var BostonTabs = (function () {
  var tabs;
  var menuToggle;

  function listenToTabs(tabs) {
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function (ev) {
        var path = ev.target.getAttribute('data-href');

        if (path) {
          location.hash = path;
          menuToggle.checked = false;
        }
      });
    }
  }

  function checkForHash() {
    var controls = document.querySelectorAll('.tab-ctrl');

    for (var i = 0; i < controls.length; i++) {
      if (controls[i].getAttribute('data-hash') == location.hash) {
        controls[i].checked = true
      }
    }
  }

  function hideCloseButton() {
    var closeButton = document.querySelectorAll('.tab-li-close');
    closeButton[0].style.display = "none";
  }

  function start() {
    // Check for tabs
    tabs = document.querySelectorAll('.tab-li-a');

    // If there are tabs, run...
    if (tabs.length > 0) {
      listenToTabs(tabs);
      hideCloseButton();
      checkForHash();

      // Set the menu
      menuToggle = document.getElementById('tabMenuCTRL');
    }
  }

  return {
    start: start
  }
})()

BostonTabs.start()

'use strict'
// This module controls the City of Boston video component
// ---------------------------
var BostonVideo = (function () {
  // Set height
  var video = {};

  function getURL(video_id, video_channel) {
    if (video_channel == 'true') {
      return "https://www.youtube.com/embed/live_stream?autoplay=1&channel=" + video_id;
    } else {
      return "https://www.youtube.com/embed/" + video_id + "?autoplay=1";
    }
  }

  function handleTrigger(video) {
    var embed_url = getURL(video.el.getAttribute('data-vid-id'), video.el.getAttribute('data-vid-channel'));

    video.container.innerHTML = '<iframe src="' + embed_url + '" class="vid-v"></iframe>'
  }

  function initVideo(video) {
    video[video.id] = {
      el: video,
      container: Boston.child(video, '.vid-c')[0],
      trigger: Boston.child(video, '.vid-cta')[0]
    };

    // Set click events on each
    video[video.id].el.addEventListener('click', function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      handleTrigger(video[video.id]);
    });
  }

  // Pass the ID of the video
  function start(video_id) {
    var videos = document.querySelectorAll('.vid');

    if (videos.length > 0) {
      for (var i = 0; i < videos.length; i++) {
        initVideo(videos[i]);
      }
    }
  }

  return {
    start: start
  }
})();

BostonVideo.start();
