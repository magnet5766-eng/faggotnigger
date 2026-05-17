document.addEventListener('DOMContentLoaded', () => {

  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  const typeTarget = document.getElementById('terminal-output');
  if (typeTarget) {
    const lines = [
      { cls: 't-comment', text: '# Fortis OS - verified boot sequence' },
      { cls: 't-prompt', text: '$ ', suffix: { cls: 't-cmd', text: 'fortis verify --chain-of-trust' } },
      { cls: 't-green', text: '[ok] Secure Boot: verified' },
      { cls: 't-green', text: '[ok] Kernel integrity: verified' },
      { cls: 't-green', text: '[ok] Filesystem snapshot: mounted (read-only)' },
      { cls: 't-blue',  text: '[>>] Loading immutable root environment...' },
      { cls: 't-green', text: '[ok] Telemetry: disabled' },
      { cls: 't-green', text: '[ok] Firewall: active (deny-all egress)' },
      { cls: 't-dim',   text: '     System ready. 4 containers active.' },
    ];

    let lineIdx = 0;
    let charIdx = 0;
    let cursor = document.createElement('span');
    cursor.className = 't-cursor';

    function typeLine() {
      if (lineIdx >= lines.length) {
        typeTarget.appendChild(cursor);
        return;
      }
      const line = lines[lineIdx];
      const row = document.createElement('div');

      if (line.suffix) {
        const promptSpan = document.createElement('span');
        promptSpan.className = line.cls;
        promptSpan.textContent = line.text;
        const cmdSpan = document.createElement('span');
        cmdSpan.className = line.suffix.cls;
        row.appendChild(promptSpan);
        row.appendChild(cmdSpan);
        typeTarget.appendChild(row);
        typeInSpan(cmdSpan, line.suffix.text, () => {
          lineIdx++;
          charIdx = 0;
          setTimeout(typeLine, 60);
        });
      } else {
        const span = document.createElement('span');
        span.className = line.cls;
        row.appendChild(span);
        typeTarget.appendChild(row);
        typeInSpan(span, line.text, () => {
          lineIdx++;
          charIdx = 0;
          setTimeout(typeLine, 60);
        });
      }
    }

    function typeInSpan(span, text, done) {
      let i = 0;
      function tick() {
        span.textContent = text.slice(0, i + 1);
        i++;
        if (i < text.length) {
          setTimeout(tick, 22);
        } else {
          done();
        }
      }
      tick();
    }

    setTimeout(typeLine, 900);
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
