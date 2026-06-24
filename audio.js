/* ─── Audio controller ──────────────────────────────────────────── */

(function () {
  const startOverlay = document.getElementById("startOverlay");
  const startBtn     = document.getElementById("startBtn");

  // ─── Start overlay — dismiss on first click, enabling audio ──────
  function dismissOverlay() {
    startOverlay.classList.add("hidden");
    startOverlay.removeEventListener("click", dismissOverlay);
  }
  startOverlay.addEventListener("click", dismissOverlay);

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
        // Pause all other cards first
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

  // ─── Smooth scroll for page div ───────────────────────────────────
  // CSS scroll-behavior:smooth handles it, but this adds inertia
  // for trackpads / mouse wheels that don't naturally smooth-scroll
  const page = document.getElementById("page");
  let scrollTarget = page.scrollTop;
  let scrollCurrent = page.scrollTop;
  let rafId = null;

  page.addEventListener("wheel", e => {
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

  // ─── Scroll-aware fade: ease up in, ease out upward when scrolling back ─
  const elementMap = new Map(); // el → { prevY }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const rect = entry.boundingClientRect;
      const rootRect = entry.rootBounds;

      if (entry.isIntersecting) {
        // Coming into view — stagger cards
        const delay = el.classList.contains("card")
          ? Array.from(el.parentElement.children).indexOf(el) * 70
          : 0;
        setTimeout(() => {
          el.classList.remove("hidden-above");
          el.classList.add("visible");
        }, delay);
      } else {
        // Left view — determine if above or below viewport
        if (rootRect && rect.bottom < rootRect.top) {
          // Scrolled past (element is above viewport) — fade out upward
          el.classList.remove("visible");
          el.classList.add("hidden-above");
        } else {
          // Below viewport — reset to default below-fold state
          el.classList.remove("visible", "hidden-above");
        }
      }
    });
  }, { threshold: 0.12, root: page });

  document.querySelectorAll(".artist-title, .card").forEach(el => observer.observe(el));

})();
