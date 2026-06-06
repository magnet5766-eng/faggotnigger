// ── SCROLL FADE-IN ANIMATIONS ──────────────────
const fadeEls = document.querySelectorAll(
  '.feature-card, .step, .testimonial-card, .pricing-card, .hero-badge, .logos, .cta-inner'
);

fadeEls.forEach(el => el.classList.add('fade-up'));

const observer = new IntersectionObserver(
  entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger cards in the same parent
        const siblings = [...entry.target.parentElement.querySelectorAll('.fade-up')];
        const index = siblings.indexOf(entry.target);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 80);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

fadeEls.forEach(el => observer.observe(el));

// ── ACTIVE NAV LINK ON SCROLL ──────────────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.style.color = '';
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.style.color = 'var(--text)';
          }
        });
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

sections.forEach(s => sectionObserver.observe(s));

// ── SMOOTH NAV BACKGROUND ON SCROLL ───────────
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.style.background = 'rgba(10,10,15,0.97)';
  } else {
    nav.style.background = 'rgba(10,10,15,0.85)';
  }
}, { passive: true });

// ── SIDEBAR ITEM INTERACTION (MOCKUP) ──────────
document.querySelectorAll('.sidebar-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
