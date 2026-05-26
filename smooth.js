(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var current = window.scrollY;
  var target = window.scrollY;
  var ease = 0.1;
  var running = false;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function tick() {
    current = lerp(current, target, ease);

    var diff = Math.abs(target - current);
    if (diff < 0.5) {
      current = target;
      running = false;
      return;
    }

    window.scrollTo(0, current);
    requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', function (e) {
    e.preventDefault();
    target = Math.max(0, Math.min(
      target + e.deltaY * 1.2,
      document.body.scrollHeight - window.innerHeight
    ));

    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }, { passive: false });

  window.addEventListener('touchstart', function (e) {
    current = window.scrollY;
    target = window.scrollY;
  }, { passive: true });
})();
