/* ===========================================================================
 * Fitness Centar Galaxy — behaviour
 *
 * Plain JavaScript, no libraries and no build step. Three small jobs:
 *
 *   1. Give the fixed header a background once the page is scrolled.
 *   2. Play the scroll film: the visitor's scroll position sets the video's
 *      current time, so the clip scrubs forwards and backwards with them.
 *   3. Skip the film entirely for anyone who has reduced motion enabled.
 * =========================================================================== */

(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var band = document.querySelector(".journey");
  var video = document.querySelector(".journey__video");
  var poster = document.querySelector(".journey__poster");

  /* 1. Header background ---------------------------------------------------- */

  function syncHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();

  if (!band || !video) return;

  /* 3. Reduced motion: show the still frame and never fetch the film --------- */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    band.classList.add("is-static");
    return;
  }

  /* 2. The scroll film ----------------------------------------------------- */

  // Phones and tablets get the lighter encode. The switch is re-checked on
  // resize, so rotating a device or dragging a window picks the right file.
  function useMobileSource() {
    return (
      window.matchMedia("(max-width: 860px)").matches ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }

  function sourceFor() {
    return useMobileSource()
      ? { clip: video.dataset.mobile, poster: video.dataset.posterMobile }
      : { clip: video.dataset.desktop, poster: video.dataset.posterDesktop };
  }

  var loadedSource = null;
  var duration = 0;
  var target = 0; // where the scroll says we should be, 0..1
  var current = 0; // where the video actually is, eased toward target
  var running = false;

  function load() {
    var source = sourceFor();
    if (!source.clip) return;
    if (loadedSource === source.clip) return;

    loadedSource = source.clip;
    duration = 0;

    // The poster shown before the film paints is the first frame of the same
    // clip, so nothing jumps when the video takes over.
    if (poster && source.poster) poster.src = source.poster;
    if (source.poster) video.setAttribute("poster", source.poster);

    video.src = source.clip;
    video.load();

    video.addEventListener(
      "loadedmetadata",
      function () {
        duration = video.duration || 0;
      },
      { once: true },
    );

    video.addEventListener(
      "canplay",
      function () {
        if (poster) poster.classList.add("is-hidden");
      },
      { once: true },
    );
  }

  // Only spend bandwidth once the film is nearly on screen.
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i += 1) {
          if (entries[i].isIntersecting) load();
        }
      },
      { rootMargin: "60% 0px" },
    );
    observer.observe(band);
  } else {
    load();
  }

  // iOS will not move a video's playhead until the visitor has interacted once.
  function prime() {
    var attempt = video.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(function () {
          video.pause();
        })
        .catch(function () {
          /* Autoplay refused; scrubbing still works from the poster. */
        });
    }
    window.removeEventListener("pointerdown", prime);
    window.removeEventListener("touchstart", prime);
  }

  window.addEventListener("pointerdown", prime, { once: true, passive: true });
  window.addEventListener("touchstart", prime, { once: true, passive: true });

  // Scroll position inside the tall band becomes 0..1.
  function readScroll() {
    var travel = band.offsetHeight - window.innerHeight;
    var top = band.getBoundingClientRect().top;
    target = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
  }

  // Each frame: ease toward the target and hand the time to the video.
  function tick() {
    current += (target - current) * 0.18;

    if (duration && !video.seeking) {
      var time = Math.min(0.999, Math.max(0, current)) * duration;
      if (Math.abs(video.currentTime - time) > 0.008) {
        try {
          video.currentTime = time;
        } catch (error) {
          /* Keep the last painted frame while the browser catches up. */
        }
      }
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", readScroll, { passive: true });
  window.addEventListener("resize", function () {
    readScroll();
    if (loadedSource && loadedSource !== sourceFor().clip) load();
  });

  readScroll();

  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
})();
