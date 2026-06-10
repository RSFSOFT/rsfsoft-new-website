const fs = require('fs');
const path = require('path');

const baseDir = "c:\\Users\\HP\\Desktop\\RSFSOFT New Website";

// 1. Create disclaimer.html
const disclaimerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Earnings & Results Disclaimer | RSF Soft</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/pages.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body class="dark-theme">
  <div id="site-nav"></div>
  <main>
    <section class="page-hero" style="padding-bottom: 50px;">
      <div class="page-hero-glow"></div>
      <div class="container">
        <h1 class="page-hero-title">Earnings & <span class="gradient-text">Results Disclaimer</span></h1>
        <p class="page-hero-sub">Last updated: June 2026</p>
      </div>
    </section>
    <section class="content-section" style="padding-top: 0;">
      <div class="container" style="max-width: 800px; margin: 0 auto; line-height: 1.8; color: rgba(255,255,255,0.8);">
        <h2 style="color: #06d6f0; margin-bottom: 20px;">1. Results Are Not Guaranteed</h2>
        <p>The information, case studies, and statistics provided on the RSF Soft website (and in our promotional materials) represent the outcomes of specific clients. These results are meant as showcases of what is possible, but they are <strong>not guarantees</strong> of what your business will achieve.</p>
        <p>Search Engine Optimization (SEO), Pay-Per-Click (PPC) advertising, and digital marketing performance depend heavily on numerous factors outside of our control, including but not limited to:</p>
        <ul style="margin-bottom: 30px; margin-left: 20px; list-style-type: disc;">
          <li>Changes to search engine algorithms (e.g., Google Core Updates).</li>
          <li>The competitiveness of your specific industry or market.</li>
          <li>Your website's historical performance, domain authority, and existing penalty status.</li>
          <li>Market conditions and shifting consumer demand.</li>
        </ul>

        <h2 style="color: #06d6f0; margin-bottom: 20px;">2. Earnings Disclaimer</h2>
        <p>Any earning or income statements, or examples of earning or income, are only estimates of what we think you could earn. There is no assurance you'll do as well. If you rely upon our figures, you must accept the risk of not doing as well.</p>

        <h2 style="color: #06d6f0; margin-bottom: 20px;">3. Forward-Looking Statements</h2>
        <p>Materials on our website may contain information that includes or is based upon forward-looking statements. These express our expectations or forecasts of future events. Any and all forward-looking statements here or on any of our sales material are intended to express our opinion of earnings potential.</p>

        <h2 style="color: #06d6f0; margin-bottom: 20px;">4. Contact Us</h2>
        <p>If you have questions about this disclaimer, please contact our legal team at legal@rsfsoft.co.uk.</p>
      </div>
    </section>
  </main>
  <div id="site-footer"></div>
  <script src="js/shared.js"></script>
</body>
</html>`;
fs.writeFileSync(path.join(baseDir, 'disclaimer.html'), disclaimerHtml, 'utf8');
console.log("Created disclaimer.html");

// 2. Create accessibility.html
const accessibilityHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Statement | RSF Soft</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/pages.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body class="dark-theme">
  <div id="site-nav"></div>
  <main>
    <section class="page-hero" style="padding-bottom: 50px;">
      <div class="page-hero-glow"></div>
      <div class="container">
        <h1 class="page-hero-title">Web <span class="gradient-text">Accessibility Statement</span></h1>
        <p class="page-hero-sub">Our commitment to an inclusive web for everyone.</p>
      </div>
    </section>
    <section class="content-section" style="padding-top: 0;">
      <div class="container" style="max-width: 800px; margin: 0 auto; line-height: 1.8; color: rgba(255,255,255,0.8);">
        <p>RSF Soft is committed to making our website and digital services accessible to all users, regardless of ability. We believe that the internet should be available and accessible to everyone, and are actively working to increase the accessibility and usability of our website.</p>

        <h2 style="color: #06d6f0; margin-top: 30px; margin-bottom: 20px;">1. Conformance Status</h2>
        <p>We are continuously taking steps to improve our website to align with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines explain how to make web content more accessible for people with disabilities, and user-friendly for everyone.</p>

        <h2 style="color: #06d6f0; margin-top: 30px; margin-bottom: 20px;">2. Ongoing Efforts</h2>
        <p>Our efforts are ongoing as we implement the relevant improvements to meet WCAG 2.1 AA guidelines over time. We conduct regular audits using automated testing tools and manual evaluation to identify and rectify accessibility barriers.</p>

        <h2 style="color: #06d6f0; margin-top: 30px; margin-bottom: 20px;">3. Feedback & Contact</h2>
        <p>If you experience any difficulty accessing any part of this website, please feel free to email us at accessibility@rsfsoft.co.uk. Please provide the URL of the material you tried to access, the problem you experienced, and your contact information. We will work with you to provide the information, item, or transaction you seek through an alternate communication method that is accessible for you.</p>
      </div>
    </section>
  </main>
  <div id="site-footer"></div>
  <script src="js/shared.js"></script>
</body>
</html>`;
fs.writeFileSync(path.join(baseDir, 'accessibility.html'), accessibilityHtml, 'utf8');
console.log("Created accessibility.html");

// 3. Update shared.js for Cookie Banner and Footer Links
const sharedJsPath = path.join(baseDir, 'js', 'shared.js');
let sharedJs = fs.readFileSync(sharedJsPath, 'utf8');

// Update footer links in shared.js
const oldFooterLink = '<li><a href="refund-policy.html">Refund Policy</a></li>';
const newFooterLinks = `<li><a href="refund-policy.html">Refund Policy</a></li>
            <li><a href="disclaimer.html">Results Disclaimer</a></li>
            <li><a href="accessibility.html">Accessibility Statement</a></li>`;
if (!sharedJs.includes("disclaimer.html")) {
    sharedJs = sharedJs.replace(oldFooterLink, newFooterLinks);
}

// Add Cookie Banner Logic to the end of shared.js
const cookieBannerJs = `
/* =====================================================
   COOKIE CONSENT BANNER (GDPR / CCPA)
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('rsf_cookie_consent')) {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = \`
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
        \`;
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
`;
if (!sharedJs.includes("COOKIE CONSENT BANNER")) {
    sharedJs += cookieBannerJs;
}
fs.writeFileSync(sharedJsPath, sharedJs, 'utf8');
console.log("Updated shared.js with Cookie Banner and footer links.");

// 4. Update index.html footer
// index.html has a hardcoded footer, we need to update it there too.
function updateHtmlFiles() {
    const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));
    for (const file of files) {
        const filePath = path.join(baseDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let changed = false;

        const footerMatch = '<li><a href="refund-policy.html">Refund Policy</a></li>';
        const replaceLinks = `<li><a href="refund-policy.html">Refund Policy</a></li>
            <li><a href="disclaimer.html">Results Disclaimer</a></li>
            <li><a href="accessibility.html">Accessibility Statement</a></li>`;

        if (content.includes(footerMatch) && !content.includes("disclaimer.html")) {
            content = content.replace(footerMatch, replaceLinks);
            changed = true;
        }

        if (changed) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated footer links in " + file);
        }
    }
}
updateHtmlFiles();
