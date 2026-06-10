/* =====================================================
   RSF SOFT -- 3D Main JavaScript
   Three.js + VanillaTilt + Typed + GSAP-style animations
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  initNavbar();
  initMobileNav();
  initTypewriter();
  initScrollAnimations();
  initCounters();
  initCalculator();
  initContactForm();
  initCallbackModal();
  initScrollTop();
  initVanillaTilt();
  initProgressBars();
  initDashboardBars();
  initParallax();
});

/* =====================================================
   THREE.JS -- Interactive 3D Particle Field
   ===================================================== */
function initThreeJS() {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // Particle system
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const violet = new THREE.Color('#7c3aed');
  const cyan = new THREE.Color('#06d6f0');
  const purple = new THREE.Color('#a855f7');

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15;

    const r = Math.random();
    const c = r < 0.4 ? violet : r < 0.7 ? cyan : purple;
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Floating geometric shapes
  const shapes = [];

  const addShape = (geometry, color, x, y, z) => {
    const mat = new THREE.MeshBasicMaterial({
      color, wireframe: true, transparent: true, opacity: 0.12
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    shapes.push(mesh);
  };

  addShape(new THREE.IcosahedronGeometry(1.4, 1), 0x7c3aed, 3.5, 0.5, -2);
  addShape(new THREE.OctahedronGeometry(0.8), 0x06d6f0, -4, -1, -1);
  addShape(new THREE.TorusGeometry(1, 0.3, 8, 20), 0xa855f7, -2.5, 2, -3);
  addShape(new THREE.TetrahedronGeometry(0.7), 0x06d6f0, 2, -2, -1);

  // Mouse tracking
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Animation loop
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.05;
    targetY += (mouseY - targetY) * 0.05;

    particles.rotation.y = t * 0.04 + targetX * 0.15;
    particles.rotation.x = t * 0.02 + targetY * 0.08;

    shapes.forEach((s, i) => {
      s.rotation.x = t * (0.2 + i * 0.05);
      s.rotation.y = t * (0.15 + i * 0.04);
      s.position.y += Math.sin(t + i) * 0.001;
    });

    camera.position.x += (targetX * 0.3 - camera.position.x) * 0.05;
    camera.position.y += (-targetY * 0.2 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  };
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* =====================================================
   TYPEWRITER EFFECT
   ===================================================== */
const typewriterTexts = [
  'Web Development',
  'App Development',
  'SEO Mastery',
  'Social Media Growth',
  'Brand Building',
  'Digital Marketing',
  'Content Creation',
  'Business Growth'
];

function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  let textIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let delay = 120;

  const type = () => {
    const current = typewriterTexts[textIndex];
    if (!isDeleting) {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        isDeleting = true;
        delay = 2000;
      } else {
        delay = 110;
      }
    } else {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % typewriterTexts.length;
        delay = 400;
      } else {
        delay = 60;
      }
    }
    setTimeout(type, delay);
  };
  type();
}

/* =====================================================
   NAVBAR
   ===================================================== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* =====================================================
   MOBILE NAV
   ===================================================== */
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const open = mobileMenu ? mobileMenu.classList.toggle('open') : false;
    const spans = toggle.querySelectorAll('span');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });

  // Close mobile menu when a link is clicked
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        const spans = toggle.querySelectorAll('span');
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }
}



/* =====================================================
   SCROLL ANIMATIONS
   ===================================================== */
function initScrollAnimations() {
  const els = document.querySelectorAll('.aos, .aos-left, .aos-right, .aos-scale');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  els.forEach(el => obs.observe(el));
}

/* =====================================================
   ANIMATED COUNTERS
   ===================================================== */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animated = new Set();

  function tryAnimate(el) {
    if (animated.has(el)) return;
    animated.add(el);
    animateCount(el);
  }

  // Run immediately for any counter already visible or near viewport
  setTimeout(() => {
    counters.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200) tryAnimate(el);
    });
  }, 300);

  // Also run on scroll for counters below fold
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        tryAnimate(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px 100px 0px' });

  counters.forEach(el => obs.observe(el));
}

function animateCount(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 2000;
  const start = Date.now();

  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = current >= 1000
      ? current.toLocaleString() + suffix
      : current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target >= 1000
      ? target.toLocaleString() + suffix
      : target + suffix;
  };
  requestAnimationFrame(tick);
}

/* =====================================================
   DASHBOARD ANIMATED BARS (Hero)
   ===================================================== */
function initDashboardBars() {
  const heights = [40, 65, 50, 80, 55, 90, 70, 60, 85, 45];
  const bars = document.querySelectorAll('.bar');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      bar.style.height = (heights[i % heights.length] || 60) + '%';
    }, 200 + i * 80);
  });
}

/* =====================================================
   PROGRESS BARS (Message cards)
   ===================================================== */
function initProgressBars() {
  const bars = document.querySelectorAll('.msg-progress-bar');
  if (!bars.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const width = e.target.getAttribute('data-width') || '75';
        setTimeout(() => { e.target.style.width = width + '%'; }, 200);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(b => obs.observe(b));
}

/* =====================================================
   VANILLA TILT -- 3D Card hover
   ===================================================== */
function initVanillaTilt() {
  if (typeof VanillaTilt === 'undefined') return;
  VanillaTilt.init(document.querySelectorAll('.service-card-3d, .msg-card'), {
    max: 12,
    speed: 400,
    glare: true,
    'max-glare': 0.12,
    gyroscope: false
  });
}

/* =====================================================
   PARALLAX MOUSE EFFECT
   ===================================================== */
function initParallax() {
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;

    document.querySelectorAll('.hero-glow-1').forEach(el => {
      el.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
    });
    document.querySelectorAll('.hero-glow-2').forEach(el => {
      el.style.transform = `translate(${-x * 0.3}px, ${-y * 0.3}px)`;
    });
  });
}

/* =====================================================
   PRICING CALCULATOR
   ===================================================== */
const calcCfg = {
  web: {
    base: 499,
    pages: { '1-5 Pages': 0, '6-15 Pages': 200, '16-30 Pages': 500, '30+ Pages': 1200 },
    features: { 'CMS': 300, 'E-Commerce': 800, 'Custom API': 600, 'Multi-Language': 400, 'Blog': 150, 'SEO Optimized': 250 },
    timeline: { 'Rush (1 week)': 500, 'Standard (3-4 wks)': 0, 'Flexible (6-8 wks)': -100 }
  },
  app: {
    base: 999,
    platform: { 'iOS Only': 0, 'Android Only': 0, 'Cross-Platform': 600, 'Both Native': 1400 },
    features: { 'User Auth': 300, 'Push Notifs': 200, 'In-App Purchase': 500, 'Maps/GPS': 400, 'Chat': 600, 'Admin Panel': 700 },
    timeline: { 'Rush (3 wks)': 800, 'Standard (6-8 wks)': 0, 'Flexible (3-4 mo)': -200 }
  }
};

let activeCalc = 'web';
const wSel = { pages: '1-5 Pages', features: new Set(), timeline: 'Standard (3-4 wks)' };
const aSel = { platform: 'iOS Only', features: new Set(), timeline: 'Standard (6-8 wks)' };

function initCalculator() {
  document.querySelectorAll('.calc-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCalc = tab.dataset.calc;
      renderCalcOpts();
      updateCalcPrice();
    });
  });
  renderCalcOpts();
  updateCalcPrice();
}

function renderCalcOpts() {
  const cont = document.getElementById('calc-opts-body');
  if (!cont) return;
  const cfg = calcCfg[activeCalc];
  const sel = activeCalc === 'web' ? wSel : aSel;
  let html = '';

  if (activeCalc === 'web') {
    html += `<h4>Number of Pages</h4><div class="chip-row" data-grp="pages">${Object.keys(cfg.pages).map(k => `<div class="chip ${sel.pages === k ? 'sel' : ''}" data-val="${k}">${k}</div>`).join('')}</div>`;
  } else {
    html += `<h4>Target Platform</h4><div class="chip-row" data-grp="platform">${Object.keys(cfg.platform).map(k => `<div class="chip ${sel.platform === k ? 'sel' : ''}" data-val="${k}">${k}</div>`).join('')}</div>`;
  }

  html += `<h4>Key Features</h4><div class="chip-row" data-grp="features">${Object.keys(cfg.features).map(k => `<div class="chip ${sel.features.has(k) ? 'sel' : ''}" data-val="${k}">${k}</div>`).join('')}</div>`;
  html += `<h4>Timeline</h4><div class="chip-row" data-grp="timeline">${Object.keys(cfg.timeline).map(k => `<div class="chip ${sel.timeline === k ? 'sel' : ''}" data-val="${k}">${k}</div>`).join('')}</div>`;

  cont.innerHTML = html;

  cont.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const grp = chip.parentElement.dataset.grp;
      const val = chip.dataset.val;
      const sel = activeCalc === 'web' ? wSel : aSel;
      if (grp === 'features') {
        sel.features.has(val) ? sel.features.delete(val) : sel.features.add(val);
        chip.classList.toggle('sel');
      } else {
        chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('sel'));
        chip.classList.add('sel');
        sel[grp] = val;
      }
      updateCalcPrice();
    });
  });
}

function updateCalcPrice() {
  const cfg = calcCfg[activeCalc];
  const sel = activeCalc === 'web' ? wSel : aSel;
  const priceEl = document.getElementById('calc-price-display');
  const timeEl = document.getElementById('calc-timeline-display');
  if (!priceEl) return;

  let total = cfg.base;
  if (activeCalc === 'web') { total += (cfg.pages[sel.pages] || 0) + (cfg.timeline[sel.timeline] || 0); }
  else { total += (cfg.platform[sel.platform] || 0) + (cfg.timeline[sel.timeline] || 0); }
  sel.features.forEach(f => { total += cfg.features[f] || 0; });

  const tlMap = {
    'Rush (1 week)': '~1 week', 'Standard (3-4 wks)': '3-4 weeks', 'Flexible (6-8 wks)': '6-8 weeks',
    'Rush (3 wks)': '~3 weeks', 'Standard (6-8 wks)': '6-8 weeks', 'Flexible (3-4 mo)': '3-4 months'
  };
  const tl = activeCalc === 'web' ? sel.timeline : sel.timeline;

  priceEl.textContent = '£' + total.toLocaleString();
  if (timeEl) timeEl.textContent = 'Est. delivery: ' + (tlMap[tl] || 'TBD');
}

/* =====================================================
   CONTACT FORM
   ===================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const ok = document.getElementById('form-ok');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      if (ok) { ok.style.display = 'block'; ok.textContent = ' Message sent! We\'ll respond within 24 hours.'; }
      btn.textContent = 'Sent! v';
      form.reset();
      setTimeout(() => {
        btn.textContent = 'Send Message ->';
        btn.disabled = false;
        if (ok) ok.style.display = 'none';
      }, 4000);
    }, 1500);
  });
}

/* =====================================================
   CALLBACK MODAL
   ===================================================== */
function initCallbackModal() {
  const overlay = document.getElementById('callback-modal');
  if (!overlay) return;
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('callback-form');

  document.querySelectorAll('[data-modal="callback"]').forEach(btn => {
    btn.addEventListener('click', () => { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; });
  });

  const close = () => { overlay.classList.remove('active'); document.body.style.overflow = ''; };
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const ok = document.getElementById('cb-ok');
    btn.textContent = 'Calling you...';
    btn.disabled = true;
    setTimeout(() => {
      if (ok) { ok.style.display = 'block'; ok.textContent = ' We\'ll call you in under 5 minutes!'; }
      form.reset();
      setTimeout(() => { close(); if (ok) ok.style.display = 'none'; btn.textContent = 'Request Callback'; btn.disabled = false; }, 3000);
    }, 1200);
  });
}

/* =====================================================
   SCROLL TO TOP
   ===================================================== */
function initScrollTop() {
  const btn = document.querySelector('.scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('vis', window.scrollY > 500));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
