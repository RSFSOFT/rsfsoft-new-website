/* =====================================================
   RSF SOFT -- Micro Animations Engine (animations.js)
   Stripped to essentials -- fast, light, non-blocking
   ===================================================== */
(function () {
  'use strict';

  const mobile = window.innerWidth <= 768 || ('ontouchstart' in window);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     1. SCROLL PROGRESS BAR
     ============================================ */
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });

  if (reduced) return; // Stop here for reduced-motion users

  /* ============================================
     2. BACKGROUND GRID MESH (desktop only)
     ============================================ */
  if (!mobile) {
    const mesh = document.createElement('div');
    mesh.className = 'bg-grid-mesh';
    document.body.prepend(mesh);
  }

  /* ============================================
     3. 3 FLOATING BADGES (desktop only)
     ============================================ */
  if (!mobile) {
    const badges = [
      { cls: 'float-badge-1', icon: '', dot: '',       text: 'Google Partner' },
      { cls: 'float-badge-2', icon: '*', dot: 'cyan',   text: '4.9* Trustpilot' },
      { cls: 'float-badge-3', icon: '', dot: 'violet', text: '1,500+ Clients' },
    ];
    badges.forEach(b => {
      const el = document.createElement('div');
      el.className = `float-badge ${b.cls}`;
      el.innerHTML = `<span>${b.icon}</span><div class="float-badge-dot ${b.dot}"></div><span>${b.text}</span>`;
      document.body.appendChild(el);
    });
  }

  /* ============================================
     4. CURSOR GLOW (desktop only)
     ============================================ */
  if (!mobile) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    // Throttled mousemove -- only update every 32ms (~30fps)
    let lastMove = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastMove < 32) return;
      lastMove = now;
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ============================================
     5. ENTRANCE ANIMATIONS (all devices)
        Uses IntersectionObserver -- zero JS cost
        until elements actually enter viewport
     ============================================ */
  const targets = document.querySelectorAll(
    '.feature-block, .pricing-card, .testi-card, .process-step, .faq-item, .stat-flip-card, .why-item'
  );

  if (targets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('anim-enter');
        // Staggered delay -- cap at 4 to avoid long waits
        const delay = Math.min(i % 6, 5) * 80;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08 });

    targets.forEach(el => {
      el.classList.add('anim-enter');
      io.observe(el);
    });
  }

  /* ============================================
     6. SHIMMER on badges & featured cards
     ============================================ */
  document.querySelectorAll(
    '.section-badge, .page-hero-badge, .pricing-card.featured, .pricing-badge'
  ).forEach(el => el.classList.add('shimmer'));

  /* ============================================
     7. NEON PULSE on CTA buttons
     ============================================ */
  document.querySelectorAll('.cta-banner .btn-primary-3d').forEach(btn =>
    btn.classList.add('neon-pulse')
  );

  /* ============================================
     8. SCAN SWEEP on hero (desktop)
     ============================================ */
  if (!mobile) {
    const hero = document.querySelector('.hero, .page-hero');
    if (hero) {
      if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
      const sweep = document.createElement('div');
      sweep.className = 'scan-sweep';
      hero.appendChild(sweep);
    }
  }

  /* ============================================
     9. PULSING RINGS on CTA banners (desktop)
     ============================================ */
  if (!mobile) {
    document.querySelectorAll('.cta-banner').forEach(cta => {
      cta.style.position = 'relative';
      cta.style.overflow = 'hidden';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;display:flex;align-items:center;justify-content:center;';
      for (let i = 1; i <= 3; i++) {
        const ring = document.createElement('div');
        ring.className = `pulse-ring pulse-ring-${i}`;
        ring.style.cssText = 'position:absolute;';
        wrap.appendChild(ring);
      }
      cta.prepend(wrap);
    });
  }

  /* ============================================
     10. TYPEWRITER EFFECT
     ============================================ */
  const tw = document.querySelector('.typewriter-wrap');
  if (tw) {
    const words = (tw.dataset.words || 'Web Development|App Development|SEO|Social Media|Digital Growth').split('|');
    let wi = 0, ci = 0, del = false;

    const tick = () => {
      const word = words[wi];
      if (del) {
        tw.textContent = word.slice(0, --ci);
        if (ci === 0) { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 350); return; }
      } else {
        tw.textContent = word.slice(0, ++ci);
        if (ci === word.length) { del = true; setTimeout(tick, 2000); return; }
      }
      setTimeout(tick, del ? 45 : 75);
    };
    setTimeout(tick, 800);
  }
  
  
})();
