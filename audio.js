/* ─── Audio controller ──────────────────────────────────────────── */

(function () {
  const page = document.getElementById("page");
  const isPerfMode = () => document.body.classList.contains("perf-mode");

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

  // ─── Scroll-aware fade (disabled in perf mode) ───────────────────
  const allFadeEls = document.querySelectorAll(".artist-title, .card");

  // Pre-cache each card's index so we never do indexOf during scroll
  allFadeEls.forEach(el => {
    if (el.classList.contains("card")) {
      el._staggerIndex = Array.from(el.parentElement.children).indexOf(el);
    }
  });

  function applyPerfModeVisibility() {
    allFadeEls.forEach(el => {
      el.classList.remove("hidden-above");
      el.classList.add("visible");
    });
  }

  // Batch pending shows into one rAF to avoid per-element repaints
  let pendingShow = [];
  let showRaf = null;

  function flushShow() {
    pendingShow.forEach(el => {
      el.classList.remove("hidden-above");
      el.classList.add("visible");
    });
    pendingShow = [];
    showRaf = null;
  }

  const observer = new IntersectionObserver((entries) => {
    if (isPerfMode()) return;
    entries.forEach(entry => {
      const el = entry.target;

      if (entry.isIntersecting) {
        // Stagger cards via index offset in the batch flush
        const delay = (el._staggerIndex || 0) * 30;
        if (delay === 0) {
          pendingShow.push(el);
          if (!showRaf) showRaf = requestAnimationFrame(flushShow);
        } else {
          setTimeout(() => {
            el.classList.remove("hidden-above");
            el.classList.add("visible");
          }, delay);
        }
      } else {
        const rect = entry.boundingClientRect;
        const rootRect = entry.rootBounds;
        if (rootRect && rect.bottom < rootRect.top) {
          el.classList.remove("visible");
          el.classList.add("hidden-above");
        } else {
          el.classList.remove("visible", "hidden-above");
        }
      }
    });
  }, { threshold: 0.08, root: page }); // lower threshold = fires earlier, less catch-up paint

  // Perf mode toggle handler
  const perfBtn = document.getElementById("perfBtn");
  if (perfBtn) {
    perfBtn.addEventListener("click", () => {
      requestAnimationFrame(() => {
        if (isPerfMode()) {
          applyPerfModeVisibility();
        } else {
          allFadeEls.forEach(el => el.classList.remove("visible", "hidden-above"));
          page.dispatchEvent(new Event("scroll"));
        }
      });
    });
  }

  // Init
  if (isPerfMode()) {
    applyPerfModeVisibility();
  } else {
    allFadeEls.forEach(el => observer.observe(el));
  }

  const bodyObserver = new MutationObserver(() => {
    if (!isPerfMode()) {
      allFadeEls.forEach(el => observer.observe(el));
    }
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

})();
