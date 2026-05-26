(function () {
  var wrap = document.getElementById('tiltWrap');
  var inner = document.getElementById('tiltInner');
  if (!wrap || !inner) return;

  var currentX = 0;
  var currentY = 0;
  var targetX = 0;
  var targetY = 0;
  var rafId = null;
  var isHovering = false;
  var MAX_TILT = 12;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, 0.1);
    currentY = lerp(currentY, targetY, 0.1);

    inner.style.transform = 'rotateY(' + currentX + 'deg) rotateX(' + (-currentY) + 'deg)';

    var dx = Math.abs(currentX - targetX);
    var dy = Math.abs(currentY - targetY);

    if (!isHovering && dx < 0.01 && dy < 0.01) {
      currentX = 0;
      currentY = 0;
      inner.style.transform = 'rotateY(0deg) rotateX(0deg)';
      cancelAnimationFrame(rafId);
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(animate);
  }

  wrap.addEventListener('mousemove', function (e) {
    var rect = wrap.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width - 0.5;
    var y = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = x * MAX_TILT * 2;
    targetY = y * MAX_TILT * 2;

    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  });

  wrap.addEventListener('mouseenter', function () {
    isHovering = true;
  });

  wrap.addEventListener('mouseleave', function () {
    isHovering = false;
    targetX = 0;
    targetY = 0;
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  });
})();
