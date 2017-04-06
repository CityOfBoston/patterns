'use strict'
// This module controls the City of Boston video component
// ---------------------------
var BostonVideo = (function () {
  // Set height
  var video = {};

  function getURL(video_id, video_channel) {
    console.log(video_channel);
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
