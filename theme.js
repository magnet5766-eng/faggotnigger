(function () {
  const STORAGE_KEY = 'theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  apply(getPreferred());

  btn.addEventListener('click', function () {
    const current = root.getAttribute('data-theme');
    apply(current === DARK ? LIGHT : DARK);
  });
})();
