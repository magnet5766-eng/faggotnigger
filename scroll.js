(function () {
  var elements = [];
  var lastScrollY = window.scrollY;
  var ticking = false;

  function init() {
    elements = Array.from(document.querySelectorAll('.reveal'));
    var groups = {};
    elements.forEach(function (el) {
      var parent = el.parentElement;
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(el);
    });
    Object.values(groups).forEach(function (group) {
      group.forEach(function (el, i) {
        var d = i * 0.09;
        el.style.transitionDelay = d + 's, ' + d + 's';
      });
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
      var inView = rect.top < viewH * 0.93 && rect.bottom > viewH * 0.05;

      if (inView) {
        el.classList.add('visible');
        el.classList.remove('hidden');
      } else if (!scrollingDown && rect.bottom < viewH * 0.05) {
        el.classList.remove('visible');
        el.classList.add('hidden');
      } else if (scrollingDown && rect.top > viewH * 0.93) {
        el.classList.remove('visible');
        el.classList.remove('hidden');
      }
    });
  }

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
