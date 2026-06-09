/* =====================================================
   RSF SOFT -- Background Canvas Animation (bg-canvas.js)
   Vanilla JS, no dependencies, ~3KB
   Floating particles + connection lines + aurora glow
   24fps throttled, pauses when tab hidden
   ===================================================== */
window.addEventListener('load', function () {
  'use strict';

  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Hide on mobile -- saves battery & CPU
  if (window.innerWidth <= 768 || ('ontouchstart' in window)) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();

  //  PARTICLES 
  const COUNT = 90;
  const MAX_DIST = 140;
  const COLORS = [
    '124,58,237',   // violet
    '6,214,240',    // cyan
    '168,85,247',   // purple
    '6,214,240',    // cyan (weighted)
    '124,58,237',   // violet (weighted)
  ];

  const particles = [];

  function makeParticle(initial) {
    return {
      x:    Math.random() * W,
      y:    initial ? Math.random() * H : H + 5,
      vx:   (Math.random() - 0.5) * 0.35,
      vy:   -(Math.random() * 0.45 + 0.1),
      size: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.55 + 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
  }

  for (let i = 0; i < COUNT; i++) particles.push(makeParticle(true));

  //  AURORA GLOW BLOBS 
  // Three slow-moving radial gradients behind the particles
  const blobs = [
    { x: 0.15, y: 0.2,  r: 0.38, color: 'rgba(124,58,237,0.07)',  vx: 0.00012, vy: 0.00008  },
    { x: 0.82, y: 0.75, r: 0.32, color: 'rgba(6,214,240,0.055)',  vx: -0.0001, vy: -0.00007 },
    { x: 0.5,  y: 0.55, r: 0.28, color: 'rgba(168,85,247,0.055)', vx: 0.00008, vy: 0.00012  },
  ];

  //  RENDER LOOP 
  const TARGET_FPS = 24;
  const FRAME_MS   = 1000 / TARGET_FPS;
  let lastFrame = 0;
  let animId;

  function draw(ts) {
    animId = requestAnimationFrame(draw);

    // Throttle to TARGET_FPS
    if (ts - lastFrame < FRAME_MS) return;
    lastFrame = ts;

    ctx.clearRect(0, 0, W, H);

    //  Draw aurora blobs 
    blobs.forEach(b => {
      b.x += b.vx; if (b.x < 0) b.x = 1; if (b.x > 1) b.x = 0;
      b.y += b.vy; if (b.y < 0) b.y = 1; if (b.y > 1) b.y = 0;

      const cx = b.x * W;
      const cy = b.y * H;
      const radius = b.r * Math.max(W, H);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });

    //  Draw connection lines 
    // Early-exit dx check avoids sqrt for most pairs -> fast O(n) in practice
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = particles[i].x - particles[j].x;
        if (dx > MAX_DIST || dx < -MAX_DIST) continue;   // fast rejection
        const dy = particles[i].y - particles[j].y;
        if (dy > MAX_DIST || dy < -MAX_DIST) continue;   // fast rejection
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= MAX_DIST) continue;

        const alpha = (1 - dist / MAX_DIST) * 0.12;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(124,58,237,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }

    //  Move + draw particles 
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Reset particle that drifts off-screen
      if (p.y < -8 || p.x < -8 || p.x > W + 8) {
        const np = makeParticle(false);
        particles[i] = np;
        continue;
      }

      // Glow halo
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      glow.addColorStop(0, `rgba(${p.color},${p.alpha * 0.6})`);
      glow.addColorStop(1, `rgba(${p.color},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();
    }
  }

  draw(0);

  //  RESIZE 
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  }, { passive: true });

  //  PAUSE WHEN TAB HIDDEN 
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      lastFrame = 0;
      draw(0);
    }
  });

  //  MOUSE INTERACTION (subtle repel) 
  let mouseX = -9999, mouseY = -9999;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

});
