/* ─── Audio controller ──────────────────────────────────────────── */

(function () {
  const audio        = document.getElementById("bgMusic");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const muteBtn      = document.getElementById("muteBtn");
  const volSlider    = document.getElementById("volSlider");
  const volFill      = document.getElementById("volFill");
  const startOverlay = document.getElementById("startOverlay");
  const startBtn     = document.getElementById("startBtn");

  // ─── State ──────────────────────────────────────────────────────
  let lastVolume = 1;
  audio.volume = 1;
  updateFill(100);

  // ─── Button state always driven by audio events ─────────────────
  audio.addEventListener("play", () => {
    playPauseBtn.classList.remove("paused");
    playPauseBtn.setAttribute("aria-label", "Pause music");
    playPauseBtn.setAttribute("title",      "Pause music");
  });

  audio.addEventListener("pause", () => {
    playPauseBtn.classList.add("paused");
    playPauseBtn.setAttribute("aria-label", "Play music");
    playPauseBtn.setAttribute("title",      "Play music");
  });

  // ─── Start overlay — dismiss on click, then play ─────────────────
  // Browsers require a real user gesture before audio can play.
  // We show a minimal overlay; clicking it satisfies that requirement.
  function dismissAndPlay() {
    startOverlay.classList.add("hidden");
    audio.play().catch(console.warn);
    startOverlay.removeEventListener("click", dismissAndPlay);
  }

  startOverlay.addEventListener("click", dismissAndPlay);

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
      audio.volume  = restore;
      volSlider.value = restore * 100;
      updateFill(restore * 100);
      setMuteIcon(restore < 0.4 ? "low" : "high");
    } else {
      lastVolume      = audio.volume;
      audio.muted     = true;
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
