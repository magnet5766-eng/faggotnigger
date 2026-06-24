/* ─── Audio controller ──────────────────────────────────────────── */

(function () {

  // ─── Per-card audio setup ────────────────────────────────────────
  document.querySelectorAll(".card[data-src]").forEach(card => {
    const audio   = card.querySelector(".card-audio");
    const playBtn = card.querySelector(".card-playpause");
    const muteBtn = card.querySelector(".card-mute");
    const slider  = card.querySelector(".card-vol-slider");
    const fill    = card.querySelector(".card-vol-fill");

    let lastVol = 1;
    audio.volume = 1;

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

  // ─── Smooth inertia scroll ────────────────────────────────────────
  const page = document.getElementById("page");
  let scrollTarget  = page.scrollTop;
  let scrollCurrent = page.scrollTop;
  let rafId = null;

  page.addEventListener("wheel", e => {
    e.preventDefault();
    scrollTarget += e.deltaY * 0.9;
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
    scrollCurrent += diff * 0.14;
    page.scrollTop = scrollCurrent;
    rafId = requestAnimationFrame(animateScroll);
  }

  // ─── Card entrance animation (staggered on load) ──────────────────
  // Cards live inside overflow-x containers so IntersectionObserver
  // with a vertical root can't reliably detect them. Instead we do a
  // simple staggered entrance on page load, and let the hover lift
  // handle the interactive feel.
  const allCards = document.querySelectorAll(".card");
  allCards.forEach(card => card.classList.add("card-animate"));

  // After one frame (so opacity:0 is painted), stagger them in
  requestAnimationFrame(() => {
    allCards.forEach((card, i) => {
      setTimeout(() => card.classList.add("visible"), i * 60);
    });
  });

  // ─── Title scroll-fade (titles ARE in the vertical scroll flow) ───
  document.querySelectorAll(".artist-title").forEach(el => {
    // start hidden
    el.style.opacity = "0";
    el.style.transform = "translateX(-20px)";
  });

  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el   = entry.target;
      const rect = entry.boundingClientRect;
      const root = entry.rootBounds;

      if (entry.isIntersecting) {
        el.classList.remove("hidden-above");
        el.classList.add("visible");
      } else {
        const isAbove = root && rect.bottom < root.top;
        el.classList.remove("visible");
        el.classList.toggle("hidden-above", isAbove);
      }
    });
  }, { root: page, threshold: 0.2 });

  document.querySelectorAll(".artist-title").forEach(el => titleObserver.observe(el));

})();
