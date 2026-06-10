/* =====================================================
   RSF SOFT -- Shared Header / Footer JS
   Injects nav and footer into every inner page
   ===================================================== */

const NAV_HTML = `
<div class="top-bar">
  <div class="top-bar-ticker">
    <span><i class="fa fa-users" style="margin-right:5px;"></i> Trusted by <strong>150+</strong> businesses globally</span>
    <span class="ticker-sep">|</span>
    <span><i class="fa fa-phone" style="margin-right:5px;"></i> UK Office: <a href="tel:+441296794358">+441296794358</a></span>
    <span class="ticker-sep">|</span>
    <span><i class="fa fa-phone" style="margin-right:5px;"></i> PK Operations: <a href="tel:+923200605762">+92-320-060-5762</a></span>
    <span class="ticker-sep">|</span>
    <span><i class="fa fa-clock" style="margin-right:5px;"></i> Monday to Friday, 9am&ndash;6pm</span>
    <span class="ticker-sep">|</span>
    <a href="https://partnersdirectory.withgoogle.com/partners/2646423901" target="_blank" rel="noopener noreferrer" title="RSF Soft — Certified Google Partner" style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;opacity:0.9;transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.9'">
      <img src="https://www.gstatic.com/partners/badge/images/2024/PartnerBadgeClickable.svg" alt="Google Partner" style="height:22px;width:auto;vertical-align:middle;" onerror="this.style.display='none'">
    </a>
    <span class="ticker-sep">|</span>
    <a href="https://www.trustpilot.com/review/www.rsfsoft.com" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:5px;text-decoration:none;color:inherit;" title="RSF Soft on Trustpilot">
      <span style="color:#00b67a;font-size:0.8rem;letter-spacing:1px;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
      <span style="font-size:0.72rem;color:rgba(255,255,255,0.7);font-weight:600;">Trustpilot</span>
    </a>
  </div>
</div>
<nav class="navbar" id="navbar">
  <div class="nav-container">
    <a href="index.html" class="nav-logo" style="text-decoration:none;">
      <span style="font-size:1.8rem; font-weight:900; font-family:'Outfit',sans-serif; background:linear-gradient(135deg,#7c3aed,#06d6f0); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing:1px;">RSF SOFT</span>
    </a>
    <ul class="nav-menu" id="nav-menu">
      <li class="nav-item"><a href="index.html" class="nav-link">Home</a></li>
      <li class="nav-item"><a href="about-us.html" class="nav-link">About Us</a></li>
      <li class="nav-item has-dropdown">
        <a href="#" class="nav-link">Services</a>
        <ul class="dropdown-menu">
          <li><a href="search-engine-optimization.html"><i class="fa fa-search"></i> SEO</a></li>
          <li><a href="web-development.html"><i class="fa fa-laptop-code"></i> Web Development</a></li>
          <li><a href="mobile-app.html"><i class="fa fa-mobile-alt"></i> App Development</a></li>
          <li><a href="social-media-marketing.html"><i class="fa fa-hashtag"></i> Social Media</a></li>
          <li><a href="content-writing-service.html"><i class="fa fa-pen-nib"></i> Content Writing</a></li>
          <li><a href="infographic-design-service.html"><i class="fa fa-paint-brush"></i> Graphic Design</a></li>
          <li><a href="reputation-services.html"><i class="fa fa-shield-alt"></i> Reputation Mgmt</a></li>
          <li><a href="google-my-business-optimisation.html"><i class="fa fa-map-marker-alt"></i> Google Business</a></li>
          <li><a href="ppc-packages.html"><i class="fa fa-ad"></i> PPC Services</a></li>
          <li><a href="blogger-outreach-service.html"><i class="fa fa-link"></i> Blogger Outreach</a></li>
        </ul>
      </li>
      <li class="nav-item"><a href="portfolio.html" class="nav-link">Portfolio</a></li>
      <li class="nav-item"><a href="case-studies.html" class="nav-link">Case Studies</a></li>
      <li class="nav-item"><a href="blog.html" class="nav-link">Blog</a></li>
      <li class="nav-item has-dropdown">
        <a href="#" class="nav-link">Resources</a>
        <ul class="dropdown-menu">
          <li><a href="faq.html"><i class="fa fa-question-circle"></i> FAQ</a></li>
          <li><a href="careers.html"><i class="fa fa-briefcase"></i> Careers</a></li>
          <li><a href="pay-now.html"><i class="fa fa-credit-card"></i> Pay Now</a></li>
        </ul>
      </li>
      <li class="nav-item"><a href="questionaire.html" class="nav-link nav-cta" style="margin-right:8px;background:linear-gradient(135deg,#06d6f0,#7c3aed)!important;">Get a Quote</a>
          <a href="contact-us.html" class="nav-link nav-cta">Contact Us</a></li>
    </ul>
    <button class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>`;

const FOOTER_HTML = `
<footer>
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <a href="index.html" style="text-decoration:none; display:inline-block;">
            <span style="font-size:2.2rem; font-weight:900; font-family:'Outfit',sans-serif; background:linear-gradient(135deg,#7c3aed,#06d6f0); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; letter-spacing:1px; display:block;">RSF SOFT</span>
          </a>
        </div>
        <p class="footer-desc">RSFSOFT LTD is a professional digital agency providing Web Development, App Development, SEO, Social Media Marketing, and Reputation Management. Registered in the UK with our dedicated operations and engineering center in Pakistan.</p>
        <div class="footer-soc">
          <a href="https://www.facebook.com/RsfSoft/" target="_blank" class="fsoc-btn"><i class="fab fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/rsfsoftofficial/" target="_blank" class="fsoc-btn"><i class="fab fa-instagram"></i></a>
          <a href="https://twitter.com/SoftRsf" target="_blank" class="fsoc-btn"><i class="fab fa-twitter"></i></a>
          <a href="https://www.youtube.com/channel/UCyVmyzkaACKsV6u44b52VEQ" target="_blank" class="fsoc-btn"><i class="fab fa-youtube"></i></a>
          <a href="https://www.linkedin.com/company/rsf-soft/" target="_blank" class="fsoc-btn"><i class="fab fa-linkedin-in"></i></a>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-top:20px;flex-wrap:wrap;">
          <a href="https://partnersdirectory.withgoogle.com/partners/2646423901" target="_blank" rel="noopener noreferrer" title="RSFSOFT LTD -- Certified Google Partner" style="display:inline-block;opacity:0.85;transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.85'">
            <img src="https://www.gstatic.com/partners/badge/images/2024/PartnerBadgeClickable.svg" alt="Google Partner" style="height:52px;width:auto;" onerror="this.style.display='none'">
          </a>
          <a href="https://www.trustpilot.com/review/www.rsfsoft.com" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;background:rgba(0,182,122,0.1);border:1px solid rgba(0,182,122,0.25);border-radius:10px;padding:8px 14px;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.background='rgba(0,182,122,0.18)'" onmouseout="this.style.background='rgba(0,182,122,0.1)'">
            <span style="color:#00b67a;font-size:1rem;">*****</span>
            <span style="color:#94a3b8;font-size:0.72rem;font-family:sans-serif;">Trustpilot</span>
          </a>
        </div>
      </div>
      <div>
        <div class="footer-head">Quick Links</div>
        <div class="footer-lnks">
          <a href="index.html">Home</a>
          <a href="search-engine-optimization.html">SEO Services</a>
          <a href="web-development.html">Web Development</a>
          <a href="mobile-app.html">App Development</a>
          <a href="contact-us.html">Contact Us</a>
        </div>
      </div>
      <div>
        <div class="footer-head">Services</div>
        <div class="footer-lnks">
          <a href="seo-packages.html">SEO Packages</a>
          <a href="social-media-packages.html">Social Media</a>
          <a href="ppc-packages.html">PPC Packages</a>
          <a href="content-writing-service.html">Content Writing</a>
          <a href="infographic-design-service.html">Graphic Design</a>
          <a href="reputation-services.html">Reputation Mgmt</a>
          <a href="blogger-outreach-service.html">Blogger Outreach</a>
        </div>
      </div>
      <div>
        <div class="footer-head">Contact Info</div>
        <div class="footer-contacts">
          <div class="fci"><span></span><span>UK Registered Office: <a href="tel:+441296794358">+441296794358</a></span></div>
          <div class="fci"><span></span><span>PK Operations: <a href="tel:+923200605762">+92-320-060-5762</a></span></div>
          <div class="fci"><span></span><span>Email: <a href="mailto:info@rsfsoft.com">info@rsfsoft.com</a></span></div>
          <div class="fci"><span></span><span>Hours: Monday to Friday, 9am&ndash;6pm</span></div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div style="border-top: 1px solid rgba(255,255,255,0.06); width: 100%; margin-bottom: 20px;"></div>
      <p class="footer-copy" style="margin-bottom:8px;">&copy; 2026 RSFSOFT LTD. All Rights Reserved.</p>
      <p style="font-size:0.72rem; color:rgba(148, 163, 184, 0.7); max-width:850px; margin:0 auto 16px; line-height:1.6; font-family:sans-serif;">
        RSFSOFT LTD is registered in England &amp; Wales (Company Number: 12874141).<br>
        Registered Office: 2nd Floor College House, 17 King Edwards Road, Ruislip, Middlesex, HA4 7AE, United Kingdom.
      </p>
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:8px 0 20px;flex-wrap:wrap;color:rgba(255,255,255,0.6);font-size:1.6rem;width:100%;">
        <i class="fab fa-cc-visa" title="Visa" style="background:#fff;color:#1a1f71;border-radius:4px;padding:0 3px;height:22px;display:inline-flex;align-items:center;"></i>
        <i class="fab fa-cc-mastercard" title="Mastercard" style="background:#fff;color:#eb001b;border-radius:4px;padding:0 3px;height:22px;display:inline-flex;align-items:center;"></i>
        <i class="fab fa-cc-amex" title="American Express" style="background:#fff;color:#007cc3;border-radius:4px;padding:0 3px;height:22px;display:inline-flex;align-items:center;"></i>
        <i class="fab fa-cc-apple-pay" title="Apple Pay" style="font-size:1.9rem;vertical-align:middle;"></i>
        <i class="fab fa-google-pay" title="Google Pay" style="font-size:2.2rem;vertical-align:middle;"></i>
        <span style="font-size:0.75rem;color:#94a3b8;font-family:sans-serif;margin-left:4px;letter-spacing:0.5px;"><i class="fa fa-lock" style="font-size:0.7rem;margin-right:3px;"></i> Secure Global Payments</span>
      </div>
      <div class="footer-policy">
        <a href="privacy-policy.html">Privacy Policy</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="terms-and-conditions.html">Terms &amp; Conditions</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="refund-policy.html">Refund Policy</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="compliance.html">Compliance Verification</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="cookie-policy.html">Cookie Policy</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="disclaimer.html">Results Disclaimer</a>
        <span style="color:rgba(255,255,255,0.15);font-size:0.75rem;">&bull;</span>
        <a href="accessibility.html">Accessibility Statement</a>
      </div>
    </div>
  </div>
</footer>
<div class="modal-ov" id="callback-modal">
  <div class="modal-bx">
    <button class="modal-x" id="modal-close-btn">x</button>
    <h2 class="modal-tit">Get a Callback </h2>
    <p class="modal-sub">Leave your details and a specialist will call you within 5 minutes.</p>
    <form id="callback-form" novalidate>
      <div class="form-grp"><label for="cb-name">Your Name</label><input type="text" id="cb-name" placeholder="First Name" required></div>
      <div class="form-grp"><label for="cb-phone">Mobile Number</label><input type="tel" id="cb-phone" placeholder="+44 7700 900000" required></div>
      <div class="form-grp"><label for="cb-svc">I'm interested in</label>
        <select id="cb-svc"><option value="">Choose a service...</option><option>SEO</option><option>Web Development</option><option>App Development</option><option>Social Media</option><option>Other</option></select>
      </div>
      <button type="submit" class="form-submit">Request Callback</button>
      <div class="form-ok" id="cb-ok"></div>
    </form>
  </div>
</div>
<div class="fab-wrap"><button class="fab-btn" data-modal="callback"><i class="fa fa-phone-alt"></i> Call Me Back</button></div>
<button class="scroll-top-btn" aria-label="Scroll to top">&uarr;</button>`;

// Unified initialization function called when DOM is ready or immediately if already loaded
function initSharedAll() {
  // Inject nav
  try {
    const navPlaceholder = document.getElementById('site-nav');
    if (navPlaceholder) navPlaceholder.innerHTML = NAV_HTML;
  } catch (err) {
    console.error("Error injecting nav:", err);
  }

  // Inject footer
  try {
    const footerPlaceholder = document.getElementById('site-footer');
    if (footerPlaceholder) footerPlaceholder.innerHTML = FOOTER_HTML;
  } catch (err) {
    console.error("Error injecting footer:", err);
  }

  // Init shared behaviors safely
  const safeInit = (name, fn) => {
    try {
      fn();
    } catch (err) {
      console.error(`Error initializing shared module: ${name}`, err);
    }
  };

  safeInit("Navbar", initSharedNavbar);
  safeInit("MobileNav", initSharedMobileNav);
  safeInit("CallbackModal", initSharedCallbackModal);
  safeInit("ScrollTop", initSharedScrollTop);
  safeInit("ScrollAnimations", initSharedScrollAnimations);
  safeInit("Counters", initSharedCounters);
  safeInit("Faq", initSharedFaq);
  safeInit("Visuals", initSharedVisuals);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSharedAll);
} else {
  initSharedAll();
}

function initSharedNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50));
}

function initSharedMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    if (open) { spans[0].style.transform='rotate(45deg) translate(5px,5px)'; spans[1].style.opacity='0'; spans[2].style.transform='rotate(-45deg) translate(5px,-5px)'; }
    else { spans.forEach(s=>{s.style.transform='';s.style.opacity='';}); }
  });
  document.querySelectorAll('.nav-item.has-dropdown > .nav-link').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 768) { e.preventDefault(); link.parentElement.classList.toggle('open'); }
    });
  });
  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
      toggle.querySelectorAll('span').forEach(s=>{s.style.transform='';s.style.opacity='';});
    }
  });
}

function initSharedCallbackModal() {
  const overlay = document.getElementById('callback-modal');
  if (!overlay) return;
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('callback-form');
  document.querySelectorAll('[data-modal="callback"]').forEach(btn => {
    btn.addEventListener('click', () => { overlay.classList.add('active'); document.body.style.overflow='hidden'; });
  });
  const close = () => { overlay.classList.remove('active'); document.body.style.overflow=''; };
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const ok = document.getElementById('cb-ok');
    btn.textContent = 'Calling you...'; btn.disabled = true;
    setTimeout(() => {
      if (ok) { ok.style.display='block'; ok.textContent=' We\'ll call you in under 5 minutes!'; }
      form.reset();
      setTimeout(() => { close(); if(ok) ok.style.display='none'; btn.textContent='Request Callback'; btn.disabled=false; }, 3000);
    }, 1200);
  });
}

function initSharedScrollTop() {
  const btn = document.querySelector('.scroll-top-btn');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('vis', window.scrollY > 500));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initSharedScrollAnimations() {
  const els = document.querySelectorAll('.aos, .aos-left, .aos-right, .aos-scale');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

function initSharedCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateSharedCount(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.3 });
  counters.forEach(el => obs.observe(el));
}

function animateSharedCount(el) {
  const target = parseInt(el.getAttribute('data-count'), 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 2000;
  const start = Date.now();
  const tick = () => {
    const p = Math.min((Date.now()-start)/duration, 1);
    const e = 1 - Math.pow(1-p, 4);
    el.textContent = Math.floor(e*target).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toLocaleString() + suffix;
  };
  requestAnimationFrame(tick);
}

// Page-specific contact form
function initPageContactForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const ok = form.querySelector('.form-ok');
    btn.textContent = 'Sending...'; btn.disabled = true;
    setTimeout(() => {
      if (ok) { ok.style.display='block'; ok.textContent=' Message sent! We\'ll respond within 24 hours.'; }
      btn.textContent = 'Sent! v';
      form.reset();
      setTimeout(() => { btn.textContent='Send Message ->'; btn.disabled=false; if(ok) ok.style.display='none'; }, 4000);
    }, 1500);
  });
}

/* =====================================================
   COOKIE CONSENT BANNER (GDPR / CCPA)
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('rsf_cookie_consent')) {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; max-width: 800px; margin: 0 auto; background: rgba(2, 6, 23, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(6, 214, 240, 0.3); border-radius: 16px; padding: 25px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 99999; display: flex; flex-direction: column; gap: 15px;">
                <div>
                    <h4 style="color: #fff; margin-bottom: 8px; font-family: 'Outfit', sans-serif;">🍪 We respect your privacy</h4>
                    <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin: 0; line-height: 1.5;">We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. Read our <a href="privacy-policy.html" style="color: #06d6f0; text-decoration: underline;">Privacy Policy</a>.</p>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cookie-decline" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s;">Essential Only</button>
                    <button id="cookie-accept" style="background: linear-gradient(135deg, #06d6f0, #7c3aed); border: none; color: #fff; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 15px rgba(6,214,240,0.3); transition: all 0.2s;">Accept All</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', () => {
            localStorage.setItem('rsf_cookie_consent', 'all');
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        });

        document.getElementById('cookie-decline').addEventListener('click', () => {
            localStorage.setItem('rsf_cookie_consent', 'essential');
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        });
    }
});


/* =====================================================
   VISUAL UPGRADES (Cursor, Orbs, Tilt, Counters)
   ===================================================== */
function initSharedVisuals() {
    // 1. Inject Orbs
    const orb1 = document.createElement('div');
    orb1.className = 'ambient-orb orb-1';
    const orb2 = document.createElement('div');
    orb2.className = 'ambient-orb orb-2';
    document.body.prepend(orb1, orb2);

        // 2. Inject Neon Cursor
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    document.body.appendChild(cursor);

    window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

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

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const targetAttr = el.getAttribute('data-target');
                const target = targetAttr ? parseFloat(targetAttr) : 0;
                if (isNaN(target)) {
                    observer.unobserve(el);
                    return;
                }
                const suffix = el.getAttribute('data-suffix') || '';
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
    }, { threshold: 0.5 });

    statsElements.forEach(el => statsObserver.observe(el));

    // 5. Inject Interactive Particles into Hero
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        // Create container for particles
        const pContainer = document.createElement('div');
        pContainer.id = 'tsparticles';
        pContainer.style.position = 'absolute';
        pContainer.style.top = '0';
        pContainer.style.left = '0';
        pContainer.style.width = '100%';
        pContainer.style.height = '100%';
        pContainer.style.zIndex = '0'; 
        pContainer.style.pointerEvents = 'auto'; // allow mouse interaction
        heroSection.insertBefore(pContainer, heroSection.firstChild);

        const pScript = document.createElement('script');
        pScript.src = 'https://cdn.jsdelivr.net/npm/tsparticles-preset-links@2/tsparticles.preset.links.bundle.min.js';
        pScript.onload = () => {
            if (typeof tsParticles !== 'undefined') {
                tsParticles.load("tsparticles", {
                    preset: "links",
                    background: { color: "transparent" },
                    particles: {
                        number: { value: 80, density: { enable: true, area: 800 } },
                        color: { value: "#06d6f0" },
                        links: { color: "#7c3aed", opacity: 0.3, distance: 150, enable: true },
                        move: { enable: true, speed: 1.2 },
                        size: { value: 2 },
                        opacity: { value: 0.6 }
                    },
                    interactivity: {
                        events: {
                            onHover: { enable: true, mode: "grab" },
                            onClick: { enable: true, mode: "push" },
                            resize: true
                        },
                        modes: {
                            grab: { distance: 180, links: { opacity: 0.8, color: "#06d6f0" } },
                            push: { quantity: 3 }
                        }
                    },
                    detectRetina: true
                });
            }
        };
        document.head.appendChild(pScript);
    }
}

function initSharedFaq() {
  // Capturing click listener to handle all FAQ toggles and prevent conflicting local bubbling click handlers
  document.addEventListener('click', (e) => {
    const faqQ = e.target.closest('.faq-q');
    if (!faqQ) return;
    
    // Stop any other event listeners from firing on this click
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
    
    const item = faqQ.closest('.faq-item');
    if (!item) return;
    
    const isOpen = item.classList.contains('open');
    const faqList = item.closest('.faq-list') || document;
    faqList.querySelectorAll('.faq-item.open').forEach(el => {
      el.classList.remove('open');
      const ans = el.querySelector('.faq-ans');
      if (ans) ans.style.maxHeight = '0';
    });
    
    if (!isOpen) {
      item.classList.add('open');
      const ans = item.querySelector('.faq-ans');
      const ansInner = item.querySelector('.faq-ans-inner');
      if (ans && ansInner) {
        ans.style.maxHeight = ansInner.scrollHeight + 'px';
      } else if (ans) {
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    }
  }, true); // capturing phase!
}

// Global FAQ toggle function for inline onclick handlers
window.toggleFaq = function(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const isOpen = item.classList.contains('open');
  const faqList = item.closest('.faq-list') || document;
  faqList.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    const ans = el.querySelector('.faq-ans');
    if (ans) ans.style.maxHeight = '0';
  });
  if (!isOpen) {
    item.classList.add('open');
    const ans = item.querySelector('.faq-ans');
    const ansInner = item.querySelector('.faq-ans-inner');
    if (ans && ansInner) {
      ans.style.maxHeight = ansInner.scrollHeight + 'px';
    } else if (ans) {
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  }
};
