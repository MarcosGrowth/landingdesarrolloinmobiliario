(function () {
  'use strict';

  var video = document.getElementById('bg-video');
  if (!video) return;

  var duration = 0;
  var ready    = false;
  var ticking  = false;

  function getScrollProgress() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docH      = document.documentElement.scrollHeight - window.innerHeight;
    return docH > 0 ? Math.min(Math.max(scrollTop / docH, 0), 1) : 0;
  }

  function scrubToProgress() {
    if (!ready || !duration) return;
    var progress = getScrollProgress();
    var time     = progress * duration;
    if (Math.abs(video.currentTime - time) > 0.03) {
      video.currentTime = time;
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(scrubToProgress);
      ticking = true;
    }
  }

  function fallbackToImage() {
    video.style.display = 'none';
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.style.backgroundImage = 'url(assets/edificio.jpg)';
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundPosition = 'center';
    }
  }

  video.addEventListener('loadedmetadata', function () {
    duration = video.duration;
    ready = true;
    video.pause();
    scrubToProgress();
  });

  video.addEventListener('error', fallbackToImage);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();
