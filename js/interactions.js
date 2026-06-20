(function () {
  'use strict';

  /* ── Scroll progress bar ── */
  const progressBar = document.getElementById('scroll-progress');
  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docH      = document.documentElement.scrollHeight - window.innerHeight;
    const pct       = docH > 0 ? (scrollTop / docH) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
  }

  /* ── Nav shrink ── */
  const nav = document.querySelector('nav');
  function updateNav() {
    if (!nav) return;
    if (window.scrollY > 60) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }

  window.addEventListener('scroll', () => {
    updateProgress();
    updateNav();
  }, { passive: true });

  /* ── Scroll-reveal ── */
  /* .problems-grid / .numbers-grid cards are staggered via Motion instead (see motion-effects.js) */
  const revealEls = document.querySelectorAll('.fi:not(.problems-grid .fi):not(.numbers-grid .fi)');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ── Animated counters ── */
  function animateCounter(el) {
    const raw    = el.getAttribute('data-target') || '0';
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const isFloat = raw.includes('.');
    const target  = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const duration = 1600;
    const start    = performance.now();

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = target * easeOut(progress);

      let display;
      if (isFloat) {
        display = value.toFixed(1);
      } else if (target >= 1000) {
        display = Math.floor(value).toLocaleString('es-AR');
      } else {
        display = Math.floor(value).toString();
      }

      el.textContent = prefix + display + suffix;

      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + (target >= 1000 ? target.toLocaleString('es-AR') : (isFloat ? target.toFixed(1) : target)) + suffix;
    }

    requestAnimationFrame(tick);
  }

  const counterEls = document.querySelectorAll('[data-target]');
  if (counterEls.length) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counterEls.forEach(el => counterObserver.observe(el));
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── WhatsApp float hide on form visible ── */
  const waFloat  = document.querySelector('.wa-float');
  const formSect = document.getElementById('formulario');

  if (waFloat && formSect) {
    const waObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) waFloat.classList.add('hidden');
          else waFloat.classList.remove('hidden');
        });
      },
      { threshold: 0.2 }
    );
    waObserver.observe(formSect);
  }

  /* ── Funnel items reveal ── */
  const funnelItems = document.querySelectorAll('.funnel-item');
  if (funnelItems.length) {
    const funnelObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            funnelObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    funnelItems.forEach(el => funnelObserver.observe(el));
  }
})();
