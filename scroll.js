(function () {
  var elements = [];
  var lastScrollY = window.scrollY;

  function init() {
    elements = Array.from(document.querySelectorAll('.reveal'));
    elements.forEach(function (el, i) {
      var delay = (i % 4) * 0.08;
      el.style.transitionDelay = delay + 's, ' + delay + 's';
    });
    check();
  }

  function check() {
    var scrollY = window.scrollY;
    var scrollingDown = scrollY >= lastScrollY;
    lastScrollY = scrollY;

    var viewH = window.innerHeight;

    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var inView = rect.top < viewH * 0.92 && rect.bottom > viewH * 0.04;

      if (inView) {
        el.classList.add('visible');
        el.classList.remove('hidden');
      } else if (rect.bottom <= viewH * 0.04 && !scrollingDown) {
        el.classList.remove('visible');
        el.classList.add('hidden');
      } else if (rect.top >= viewH * 0.92 && scrollingDown) {
        el.classList.remove('visible');
        el.classList.remove('hidden');
      }
    });
  }

  var ticking = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        check();
        ticking = false;
      });
      ticking = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', check, { passive: true });
})();
