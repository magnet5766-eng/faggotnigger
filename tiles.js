(function () {
  const canvas = document.getElementById('tileCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const TILE = 44;
  const LINE = 1;

  let mouse = { x: -9999, y: -9999 };
  let scrollY = 0;
  let W = 0, H = 0;
  let cols = 0, rows = 0;
  let rafId = null;

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.ceil(W / TILE) + 1;
    rows = Math.ceil(H / TILE) + 1;
    draw();
  }

  function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const dark = isDark();
    const baseAlpha = dark ? 0.07 : 0.09;
    const glowRadius = 200;
    const maxAlpha = dark ? 0.55 : 0.45;

    // Offset tiles so they scroll slightly with the page for depth
    const offsetX = (scrollY * 0.08) % TILE;
    const offsetY = (scrollY * 0.08) % TILE;

    for (let r = -1; r < rows + 1; r++) {
      for (let c = -1; c < cols + 1; c++) {
        const x = c * TILE - offsetX;
        const y = r * TILE - offsetY;

        const cx = x + TILE / 2;
        const cy = y + TILE / 2;

        const d = dist(cx, cy, mouse.x, mouse.y);
        const proximity = Math.max(0, 1 - d / glowRadius);
        const alpha = baseAlpha + proximity * (maxAlpha - baseAlpha);

        const accent = dark
          ? `rgba(107, 143, 255, ${alpha})`
          : `rgba(91, 127, 255, ${alpha})`;

        ctx.strokeStyle = accent;
        ctx.lineWidth = LINE + proximity * 0.8;

        // Hollow square
        ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
      }
    }
  }

  function tick() {
    draw();
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('touchmove', function (e) {
    if (e.touches[0]) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('scroll', function () {
    scrollY = window.scrollY;
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });

  // Re-draw when theme changes (MutationObserver on data-theme)
  new MutationObserver(draw).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  resize();
  tick();
})();
