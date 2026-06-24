/* ─── Audio controller ──────────────────────────────────────────── */

(function () {
  const page = document.getElementById("page");
  // ─── Per-card audio setup ────────────────────────────────────────
  document.querySelectorAll(".card[data-src]").forEach(card => {
    const audio     = card.querySelector(".card-audio");
    const playBtn   = card.querySelector(".card-playpause");
    const muteBtn   = card.querySelector(".card-mute");
    const slider    = card.querySelector(".card-vol-slider");
    const fill      = card.querySelector(".card-vol-fill");

    let lastVol = 1;
    audio.volume = 1;

    // ── Play/Pause ────────────────────────────────────────────────
    playBtn.addEventListener("click", () => {
      if (audio.paused) {
        document.querySelectorAll(".card-audio").forEach(a => {
          if (a !== audio) {
            a.pause();
            a.closest(".card").querySelector(".card-playpause").classList.remove("playing");
          }
        });
        audio.play().catch(console.warn);
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play",  () => playBtn.classList.add("playing"));
    audio.addEventListener("pause", () => playBtn.classList.remove("playing"));

    // ── Volume slider ─────────────────────────────────────────────
    slider.addEventListener("input", () => {
      const val = parseFloat(slider.value);
      audio.volume = val / 100;
      fill.style.width = val + "%";
      if (val === 0) {
        audio.muted = true;
        setMuteIcon("muted");
      } else {
        audio.muted = false;
        lastVol = val / 100;
        setMuteIcon(val < 40 ? "low" : "high");
      }
    });

    // ── Mute toggle ───────────────────────────────────────────────
    muteBtn.addEventListener("click", () => {
      if (audio.muted || audio.volume === 0) {
        audio.muted = false;
        const r = lastVol > 0 ? lastVol : 1;
        audio.volume = r;
        slider.value = r * 100;
        fill.style.width = (r * 100) + "%";
        setMuteIcon(r < 0.4 ? "low" : "high");
      } else {
        lastVol = audio.volume;
        audio.muted = true;
        slider.value = 0;
        fill.style.width = "0%";
        setMuteIcon("muted");
      }
    });

    function setMuteIcon(state) {
      muteBtn.classList.remove("muted", "low");
      if (state === "muted") muteBtn.classList.add("muted");
      if (state === "low")   muteBtn.classList.add("low");
    }
  });

  // ─── Smooth scroll ───────────────────────────────────────────────
  // Handled natively by CSS scroll-behavior: smooth — no JS needed.
  // The old JS RAF loop was causing lag on low-end devices by blocking
  // the browser's GPU-accelerated native scroll with preventDefault.

  // ─── Scroll-aware fade ───────────────────────────────────────────
  const allFadeEls = document.querySelectorAll(".artist-title, .card");

  // Pre-cache stagger index once so we never touch the DOM during scroll
  allFadeEls.forEach(el => {
    if (el.classList.contains("card")) {
      el._staggerIndex = Array.from(el.parentElement.children).indexOf(el);
    }
    el._showTimer = null; // track pending timer so we can cancel it
  });

  function showEl(el) {
    el.classList.remove("hidden-above");
    el.classList.add("visible");
    el._showTimer = null;
  }

  function hideEl(el, above) {
    // Cancel any pending show timer first — fixes fast-scroll ghost cards
    if (el._showTimer) { clearTimeout(el._showTimer); el._showTimer = null; }
    if (above) {
      el.classList.remove("visible");
      el.classList.add("hidden-above");
    } else {
      el.classList.remove("visible", "hidden-above");
    }
  }

  // Use rootMargin to create hysteresis:
  // Elements trigger "intersecting" a little before they're visible (50px early),
  // so the fade finishes by the time they're fully on screen.
  // This also prevents the edge-flicker where a card sitting right at the
  // threshold boundary keeps toggling in/out.
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        const delay = (el._staggerIndex || 0) * 30;
        if (delay === 0) {
          showEl(el);
        } else {
          // Only set timer if not already visible (prevents re-triggering)
          if (!el.classList.contains("visible") && !el._showTimer) {
            el._showTimer = setTimeout(() => showEl(el), delay);
          }
        }
      } else {
        const rect = entry.boundingClientRect;
        const rootRect = entry.rootBounds;
        hideEl(el, rootRect && rect.bottom < rootRect.top);
      }
    });
  }, {
    threshold: 0,           // fire as soon as any pixel enters/leaves
    rootMargin: "50px 0px", // start fade-in 50px before element reaches viewport
    root: page
  });

  // Init
  allFadeEls.forEach(el => observer.observe(el));


})();
