const fs = require('fs');
const path = require('path');

const baseDir = "c:\\Users\\HP\\Desktop\\RSFSOFT New Website";

// 1. Add CSS to styles.css or animations.css
const cssPath = path.join(baseDir, 'css', 'animations.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newCss = `
/* =====================================================
   VISUAL UPGRADES (Cursor, Orbs, Tilt)
   ===================================================== */

/* 1. Custom Cursor */
body {
  cursor: none; /* Hide default cursor */
}
a, button, input, textarea, select {
  cursor: none;
}

#custom-cursor {
  position: fixed;
  top: 0; left: 0;
  width: 12px; height: 12px;
  background: #06d6f0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 999999;
  transform: translate(-50%, -50%);
  transition: width 0.2s, height 0.2s, background 0.2s;
  mix-blend-mode: difference;
}

#cursor-glow {
  position: fixed;
  top: 0; left: 0;
  width: 40px; height: 40px;
  border: 1px solid rgba(6, 214, 240, 0.5);
  border-radius: 50%;
  pointer-events: none;
  z-index: 999998;
  transform: translate(-50%, -50%);
  transition: width 0.2s, height 0.2s, border-color 0.2s;
  transition-timing-function: ease-out;
}

.cursor-hover #custom-cursor {
  width: 24px;
  height: 24px;
  background: #7c3aed;
}

.cursor-hover #cursor-glow {
  width: 60px;
  height: 60px;
  border-color: rgba(124, 58, 237, 0.8);
  background: rgba(124, 58, 237, 0.1);
}

/* 2. Ambient Orbs */
.ambient-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  z-index: -1;
  opacity: 0.4;
  pointer-events: none;
  animation: floatOrb 20s infinite alternate ease-in-out;
}

.orb-1 {
  width: 40vw; height: 40vw;
  background: #7c3aed;
  top: -10%; left: -10%;
}

.orb-2 {
  width: 30vw; height: 30vw;
  background: #06d6f0;
  bottom: -10%; right: -10%;
  animation-delay: -10s;
}

@keyframes floatOrb {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(10vw, 5vh) scale(1.1); }
  100% { transform: translate(-5vw, 15vh) scale(0.9); }
}

/* Fix for touch devices to avoid cursor getting stuck */
@media (hover: none) and (pointer: coarse) {
  body { cursor: auto; }
  a, button, input, textarea, select { cursor: pointer; }
  #custom-cursor, #cursor-glow { display: none; }
}
`;

if (!cssContent.includes("VISUAL UPGRADES")) {
    fs.writeFileSync(cssPath, cssContent + "\n" + newCss, 'utf8');
    console.log("Injected CSS for visual upgrades.");
}

// 2. Update shared.js to inject Cursor, Orbs, and Scripts
const jsPath = path.join(baseDir, 'js', 'shared.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

const newJs = `
/* =====================================================
   VISUAL UPGRADES (Cursor, Orbs, Tilt, Counters)
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Orbs
    const orb1 = document.createElement('div');
    orb1.className = 'ambient-orb orb-1';
    const orb2 = document.createElement('div');
    orb2.className = 'ambient-orb orb-2';
    document.body.prepend(orb1, orb2);

    // 2. Inject Custom Cursor
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(cursor);
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    // Smooth follow for glow
    function animateGlow() {
        glowX += (mouseX - glowX) * 0.15;
        glowY += (mouseY - glowY) * 0.15;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(animateGlow);
    }
    animateGlow();

    // Add hover states
    const hoverElements = document.querySelectorAll('a, button, .trust-badge, .feature-card, .cs-card');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    // 3. Inject VanillaTilt.js dynamically and initialize
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.0/vanilla-tilt.min.js';
    script.onload = () => {
        // Apply tilt to cards and badges
        VanillaTilt.init(document.querySelectorAll('.trust-badge, .cs-card, .pricing-card'), {
            max: 15,
            speed: 400,
            glare: true,
            'max-glare': 0.3
        });
        
        // Find other potential cards to tilt
        const otherCards = document.querySelectorAll('[style*="border-radius:20px"]');
        otherCards.forEach(c => {
            if(!c.classList.contains('trust-badge') && c.tagName === 'DIV') {
                VanillaTilt.init(c, { max: 10, speed: 400, glare: true, 'max-glare': 0.2 });
            }
        });
    };
    document.head.appendChild(script);

    // 4. Animated Count-Up Stats
    const statsElements = document.querySelectorAll('.hstat-value, .count-up');
    
    // Prepare numbers: strip non-digits, keep suffix if any
    statsElements.forEach(el => {
        const text = el.innerText.trim();
        let numStr = text.replace(/[^0-9.]/g, '');
        let suffix = text.replace(/[0-9.,]/g, '');
        if (numStr) {
            el.setAttribute('data-target', numStr);
            el.setAttribute('data-suffix', suffix);
            el.innerText = '0' + suffix;
        }
    });

    const observerOptions = {
        threshold: 0.5
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseFloat(el.getAttribute('data-target'));
                const suffix = el.getAttribute('data-suffix');
                const duration = 2000; // ms
                const stepTime = Math.abs(Math.floor(duration / 50));
                
                let current = 0;
                const increment = target / (duration / stepTime);

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        clearInterval(timer);
                        el.innerText = (target % 1 === 0 ? target : target.toFixed(1)).toLocaleString() + suffix;
                    } else {
                        el.innerText = Math.floor(current).toLocaleString() + suffix;
                    }
                }, stepTime);

                observer.unobserve(el);
            }
        });
    }, observerOptions);

    statsElements.forEach(el => statsObserver.observe(el));
});
`;

if (!jsContent.includes("VISUAL UPGRADES")) {
    fs.writeFileSync(jsPath, jsContent + "\n" + newJs, 'utf8');
    console.log("Injected JS for visual upgrades.");
}
