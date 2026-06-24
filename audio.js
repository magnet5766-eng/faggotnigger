/* ─── Audio controller ──────────────────────────────────────────── */

(function () {

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

  // ─── Scroll-aware fade animations ─────────────────────────────────
  // We observe .artist-row sections for vertical scroll visibility,
  // then animate both the title and cards inside each row.
  // Cards in horizontal tracks can't be reliably observed individually
  // since they're inside overflow-x containers, so we drive them from
  // their parent row's intersection state.

  // Initial hidden state — set via JS so elements are visible if JS fails
  document.querySelectorAll(".artist-title").forEach(el => {
    el.classList.remove("visible", "hidden-above");
  });
  document.querySelectorAll(".card").forEach(el => {
    el.classList.remove("visible", "hidden-above");
  });

  const rowObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const row   = entry.target;
      const title = row.querySelector(".artist-title");
      const cards = Array.from(row.querySelectorAll(".card"));
      const rect  = entry.boundingClientRect;
      const root  = entry.rootBounds;

      if (entry.isIntersecting) {
        // Row entering — slide title in, stagger cards
        if (title) {
          title.classList.remove("hidden-above");
          title.classList.add("visible");
        }
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.remove("hidden-above");
            card.classList.add("visible");
          }, i * 70);
        });
      } else {
        const isAbove = root && rect.bottom < root.top;
        if (title) {
          title.classList.toggle("hidden-above", isAbove);
          title.classList.toggle("visible",      false);
          if (!isAbove) title.classList.remove("hidden-above");
        }
        cards.forEach(card => {
          card.classList.toggle("hidden-above", isAbove);
          card.classList.toggle("visible",      false);
          if (!isAbove) card.classList.remove("hidden-above");
        });
      }
    });
  }, {
    root: page,
    threshold: 0.05,   // fire as soon as 5% of the row is visible
    rootMargin: "0px"
  });

  document.querySelectorAll(".artist-row").forEach(row => rowObserver.observe(row));

})();
