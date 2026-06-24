/* ─── Audio controller ──────────────────────────────────────────── */

(function () {
  const audio        = document.getElementById("bgMusic");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const muteBtn      = document.getElementById("muteBtn");
  const volSlider    = document.getElementById("volSlider");
  const volFill      = document.getElementById("volFill");

  // ─── State ──────────────────────────────────────────────────────
  let lastVolume = 1;
  audio.volume = 1;
  updateFill(100);

  // ─── Button state always driven by audio events ─────────────────
  audio.addEventListener("play", () => {
    playPauseBtn.classList.remove("paused");
    playPauseBtn.setAttribute("aria-label", "Pause music");
    playPauseBtn.setAttribute("title", "Pause music");
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.classList.add("paused");
    playPauseBtn.setAttribute("aria-label", "Play music");
    playPauseBtn.setAttribute("title", "Play music");
  });

  // ─── Autoplay — try immediately, fall back to first interaction ──
  function tryPlay() {
    audio.play().catch(() => {
      // Browser blocked autoplay — wait for first user gesture
      const unlock = () => {
        audio.play();
        document.removeEventListener("click",      unlock);
        document.removeEventListener("keydown",    unlock);
        document.removeEventListener("touchstart", unlock);
      };
      document.addEventListener("click",      unlock);
      document.addEventListener("keydown",    unlock);
      document.addEventListener("touchstart", unlock);
    });
  }

  tryPlay();

  // ─── Play / Pause button ─────────────────────────────────────────
  playPauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  // ─── Volume slider ───────────────────────────────────────────────
  volSlider.addEventListener("input", () => {
    const val = parseFloat(volSlider.value);
    audio.volume = val / 100;
    updateFill(val);

    if (val === 0) {
      audio.muted = true;
      setMuteIcon("muted");
    } else {
      audio.muted = false;
      lastVolume = val / 100;
      setMuteIcon(val < 40 ? "low" : "high");
    }
  });

  // ─── Mute toggle ─────────────────────────────────────────────────
  muteBtn.addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      const restore = lastVolume > 0 ? lastVolume : 1;
      audio.volume = restore;
      volSlider.value = restore * 100;
      updateFill(restore * 100);
      setMuteIcon(restore < 0.4 ? "low" : "high");
    } else {
      lastVolume = audio.volume;
      audio.muted = true;
      volSlider.value = 0;
      updateFill(0);
      setMuteIcon("muted");
    }
  });

  // ─── Helpers ────────────────────────────────────────────────────
  function updateFill(value) {
    volFill.style.width = value + "%";
  }

  function setMuteIcon(state) {
    muteBtn.classList.remove("muted", "low");
    if (state === "muted") muteBtn.classList.add("muted");
    if (state === "low")   muteBtn.classList.add("low");
  }
})();
