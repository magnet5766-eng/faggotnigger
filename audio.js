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

  // ─── Intersection observer for fade-in animations ─────────────────
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // stagger cards within a row
        const delay = entry.target.classList.contains("card")
          ? Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80
          : 0;
        setTimeout(() => entry.target.classList.add("visible"), delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, root: page });

  document.querySelectorAll(".artist-title, .card").forEach(el => observer.observe(el));

})();
