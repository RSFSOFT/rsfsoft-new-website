/* RSF Soft -- Performance Enhancer (perf.js)
 * Handles: lazy loading, AOS animations, FAQ accordion, callback modal
 * Loaded with defer -- never blocks rendering
 */
(function () {
  'use strict';

  /* ============================================
     INTERSECTION OBSERVER -- AOS Animations
     ============================================ */
  const aosEls = document.querySelectorAll('.aos, .aos-left, .aos-right');
  if (aosEls.length > 0) {
    const aosObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          aosObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    aosEls.forEach(el => aosObserver.observe(el));
  }

  /* ============================================
     FAQ ACCORDION
     ============================================ */
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-ans');
    if (!btn || !ans) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-ans');
        if (a) a.style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  /* ============================================
     COUNTER ANIMATION
     ============================================ */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 2000;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);
          el.textContent = Math.round(ease * target).toLocaleString();
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        countObserver.unobserve(el);
      });
    }, { threshold: 0.3 });
    counters.forEach(c => countObserver.observe(c));
  }

  /* ============================================
     STAT COUNTERS (stat-number class)
     ============================================ */
  document.querySelectorAll('.stat-number, .stat-count').forEach(el => {
    const text = el.textContent.trim();
    const match = text.match(/[\d,]+/);
    if (!match) return;
    const target = parseInt(match[0].replace(/,/g, ''), 10);
    const suffix = text.replace(match[0], '');
    el.dataset.target = target;
    el.dataset.suffix = suffix;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const duration = 2200;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          entry.target.textContent = Math.round(ease * target).toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  /* ============================================
     CALLBACK MODAL (data-modal="callback")
     ============================================ */
  const modal = document.getElementById('callback-modal');
  if (modal) {
    document.querySelectorAll('[data-modal="callback"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
    const closeModal = () => {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    };
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  /* ============================================
     MOBILE NAV TOGGLE
     ============================================ */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
      navToggle.classList.toggle('active');
    });
  }

  /* ============================================
     NAVBAR SCROLL EFFECT
     ============================================ */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================
     SMOOTH ANCHOR SCROLL
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================
     CONTACT FORM (page-level)
     ============================================ */
  document.querySelectorAll('form[id$="-form"]:not(#callback-form)').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const ok = form.querySelector('.form-ok');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
      setTimeout(() => {
        if (ok) { ok.style.display = 'block'; ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        form.reset();
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.original || 'Send Message'; }
      }, 1500);
    });
  });

  /* ============================================
     IMAGE LAZY LOADING FALLBACK
     ============================================ */
  if (!('loading' in HTMLImageElement.prototype)) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) { img.src = img.dataset.src; }
          imgObserver.unobserve(img);
        }
      });
    });
    document.querySelectorAll('img[data-src]').forEach(img => imgObserver.observe(img));
  }

})();
