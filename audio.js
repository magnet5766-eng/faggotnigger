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

  // ─── Smooth scroll (disabled in perf mode) ───────────────────────
  let scrollTarget  = page.scrollTop;
  let scrollCurrent = page.scrollTop;
  let rafId = null;

  page.addEventListener("wheel", e => {
    if (isPerfMode()) return; // let browser handle it natively
    e.preventDefault();
    scrollTarget += e.deltaY * 0.8;
    scrollTarget = Math.max(0, Math.min(scrollTarget, page.scrollHeight - page.clientHeight));
    if (!rafId) animateScroll();
  }, { passive: false });

  function animateScroll() {
    const diff = scrollTarget - scrollCurrent;
    if (Math.abs(diff) < 0.5) {
      scrollCurrent = scrollTarget;
      page.scrollTop = scrollTarget;
      rafId = null;
      return;
    }
    scrollCurrent += diff * 0.1;
    page.scrollTop = scrollCurrent;
    rafId = requestAnimationFrame(animateScroll);
  }

  // ─── Scroll-aware fade (disabled in perf mode) ───────────────────
  const allFadeEls = document.querySelectorAll(".artist-title, .card");

  function applyPerfModeVisibility() {
    // In perf mode: make everything visible instantly, no observer needed
    allFadeEls.forEach(el => {
      el.classList.remove("hidden-above");
      el.classList.add("visible");
    });
  }

  const observer = new IntersectionObserver((entries) => {
    if (isPerfMode()) return; // observer fires but we ignore it in perf mode
    entries.forEach(entry => {
      const el = entry.target;
      const rect = entry.boundingClientRect;
      const rootRect = entry.rootBounds;

      if (entry.isIntersecting) {
        const delay = el.classList.contains("card")
          ? Array.from(el.parentElement.children).indexOf(el) * 70
          : 0;
        setTimeout(() => {
          el.classList.remove("hidden-above");
          el.classList.add("visible");
        }, delay);
      } else {
        if (rootRect && rect.bottom < rootRect.top) {
          el.classList.remove("visible");
          el.classList.add("hidden-above");
        } else {
          el.classList.remove("visible", "hidden-above");
        }
      }
    });
  }, { threshold: 0.12, root: page });

  // Watch for perf mode toggling so we can react in JS too
  const perfBtn = document.getElementById("perfBtn");
  if (perfBtn) {
    perfBtn.addEventListener("click", () => {
      // Wait a tick for body class to update
      requestAnimationFrame(() => {
        if (isPerfMode()) {
          applyPerfModeVisibility();
          // Cancel any in-flight smooth scroll
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          scrollTarget = scrollCurrent = page.scrollTop;
        }
        // On disabling perf mode: reset elements so observer re-animates them
        else {
          allFadeEls.forEach(el => {
            el.classList.remove("visible", "hidden-above");
          });
          // Re-trigger observer by nudging scroll
          page.dispatchEvent(new Event("scroll"));
        }
      });
    });
  }

  // Init: if perf mode was restored from localStorage, apply immediately
  if (isPerfMode()) {
    applyPerfModeVisibility();
  } else {
    allFadeEls.forEach(el => observer.observe(el));
  }

  // When perf mode is OFF, make sure observer is running
  // (re-observe after perf mode toggle handled above already calls reset)
  const bodyObserver = new MutationObserver(() => {
    if (!isPerfMode()) {
      allFadeEls.forEach(el => observer.observe(el));
    }
  });
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

})();
