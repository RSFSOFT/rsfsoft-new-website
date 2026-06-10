const fs = require('fs');
const path = require('path');

const baseDir = "c:\\Users\\HP\\Desktop\\RSFSOFT New Website";

const caseStudies = [
    {
        id: "design-dental",
        title: "Design Dental — Dental Practice SEO Campaign",
        service: "SEO & Organic Growth",
        region: "UK",
        image: "img/cs-uk-law.png",
        file: "case-study-design-dental.html",
        challenge: "Design Dental (design-dental.co.uk) needed to capture more local dental patients for premium treatments (implants, Invisalign, cosmetic dentistry) in their local area, but was losing search share to local competitors.",
        solution: "We deployed a hyper-local SEO campaign, optimizing their Google Business Profiles, creating treatment-specific local landing pages, fixing technical crawl issues, and acquiring links from local UK dental and medical publications.",
        results: [
            "Ranked #1 for 'Invisalign treatments' and 'dental implants' locally",
            "180% Increase in monthly private patient booking enquiries",
            "Organic monthly traffic grown by 245% since 2020",
            "Generated an estimated £140,000+ in new patient treatment value"
        ]
    },
    {
        id: "decent-removal",
        title: "Decent Removal — Local SEO & Website Development",
        service: "Web Dev & Local SEO",
        region: "UK",
        image: "img/cs-usa-ecommerce.png",
        file: "case-study-decent-removal.html",
        challenge: "Decent Removal (decentremoval.co.uk) wanted to increase bookings for their removal and clearance services, but their old website was slow, not mobile-responsive, and failed to rank in Google Maps for key local boroughs.",
        solution: "We built a brand new conversion-focused website, optimized their Google Maps / GMB listing, executed a local citation campaign across major UK business directories, and set up landing pages targeting key removal service areas.",
        results: [
            "Secured top 3 Google Maps positions in all target boroughs",
            "Website load time reduced to under 1.5 seconds",
            "310% Increase in direct telephone and form enquiries",
            "Acquired 150+ new booking requests in the first 6 months"
        ]
    },
    {
        id: "fizz-dj",
        title: "Fizz DJ — Entertainment Agency Website & Hosting",
        service: "Web Dev, Hosting & SEO",
        region: "UK",
        image: "img/cs-canada-app.png",
        file: "case-study-fizz-dj.html",
        challenge: "Fizz DJ (fizzdj.co.uk) needed a highly secure, reliable, and fast website to showcase their entertainment services, along with high-performance UK-based hosting to handle seasonal traffic spikes without slowing down.",
        solution: "We designed and developed a premium interactive website, set up dedicated SSD-powered UK hosting with cloud backup, and optimized the site structure for organic search to capture event bookings since 2020.",
        results: [
            "100% Website uptime maintained through peak event seasons",
            "Double-digit percentage increase in annual corporate booking enquiries",
            "Ranked on Page 1 for local entertainment and DJ hire terms",
            "Saved £1,200/year in infrastructure and maintenance costs"
        ]
    },
    {
        id: "taxi-bolton",
        title: "Taxi Bolton — Local Taxi Dispatch Website & SEO",
        service: "Web Dev & Local SEO",
        region: "UK",
        image: "img/cs-australia-saas.png",
        file: "case-study-taxi-bolton.html",
        challenge: "Taxi Bolton (taxibolton.com) needed to compete with national ride-hailing apps in their local city by capturing search queries from local commuters looking for reliable airport transfers and local taxi services.",
        solution: "We designed a mobile-first booking website with quick call actions, implemented a local SEO blueprint targeting Bolton and surrounding Greater Manchester areas, and automated review collection from passengers since 2020.",
        results: [
            "Ranked #1 for local 'airport transfers Bolton' and 'Bolton taxi'",
            "220% Growth in online booking submissions and phone taps",
            "Built a solid profile of 400+ 5-star passenger reviews",
            "Increased monthly recurring local commuter accounts by 85%"
        ]
    }
];

function generateIndividualPages() {
    for (const cs of caseStudies) {
        const resultsHtml = cs.results.map(res => `<li><i class='fa fa-check-circle' style='color:#06d6f0; margin-right:10px;'></i>${res}</li>`).join("");
        
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${cs.title} | RSF Soft Case Studies</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/pages.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    .cs-hero { padding: 150px 20px 80px; text-align: center; position: relative; overflow: hidden; }
    .cs-hero-img { max-width: 800px; width: 100%; border-radius: 20px; margin: 40px auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); }
    .cs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 60px; }
    .cs-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 40px; border-radius: 20px; }
    .cs-box h3 { color: #06d6f0; margin-bottom: 20px; font-size: 1.5rem; }
    .cs-results { background: linear-gradient(135deg, rgba(6,214,240,0.1), rgba(124,58,237,0.1)); border: 1px solid rgba(6,214,240,0.3); padding: 40px; border-radius: 20px; margin-bottom: 80px; }
    .cs-results h3 { color: #fff; margin-bottom: 30px; text-align: center; font-size: 2rem; }
    .cs-results ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
    .cs-results li { background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; font-weight: 600; font-size: 1.1rem; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
    @media (max-width: 768px) { .cs-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body class="dark-theme">

  <div id="site-nav"></div>

  <main>
    <section class="cs-hero">
      <div class="page-hero-glow"></div>
      <div class="container">
        <div class="page-hero-badge">${cs.region} • ${cs.service}</div>
        <h1 class="page-hero-title">${cs.title}</h1>
        <p class="page-hero-sub">Discover how we helped this client achieve massive growth through strategic digital execution.</p>
        <img src="${cs.image}" alt="${cs.title}" class="cs-hero-img">
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="cs-grid">
          <div class="cs-box">
            <h3><i class="fa fa-exclamation-triangle"></i> The Challenge</h3>
            <p>${cs.challenge}</p>
          </div>
          <div class="cs-box">
            <h3><i class="fa fa-lightbulb"></i> Our Solution</h3>
            <p>${cs.solution}</p>
          </div>
        </div>

        <div class="cs-results">
          <h3>The Results</h3>
          <ul>${resultsHtml}</ul>
        </div>

        <div class="cta-banner">
          <h2>Ready for results like this?</h2>
          <p>Let's build a custom strategy for your business.</p>
          <button class="btn-primary-3d" data-modal="callback">Get Your Free Proposal</button>
        </div>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="js/shared.js"></script>
</body>
</html>`;
        fs.writeFileSync(path.join(baseDir, cs.file), html, 'utf8');
        console.log(`Generated ${cs.file}`);
    }
}

function generateHubPage() {
    let cardsHtml = "";
    for (const cs of caseStudies) {
        cardsHtml += `
        <a href="${cs.file}" class="cs-card" data-service="${cs.service.split(' ')[0].toLowerCase()}" data-region="${cs.region.toLowerCase()}">
          <div class="cs-card-img" style="background-image:url('${cs.image}');"></div>
          <div class="cs-card-content">
            <div class="cs-card-tags">
              <span class="tag">${cs.region}</span>
              <span class="tag">${cs.service}</span>
            </div>
            <h3>${cs.title}</h3>
            <p>${cs.results[0]}</p>
            <div class="cs-card-link">Read Full Case Study <i class="fa fa-arrow-right"></i></div>
          </div>
        </a>`;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Our Work & Case Studies | RSF Soft</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/pages.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    .cs-hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; margin-top: 40px; }
    .cs-card { display: block; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit; transition: all 0.3s ease; }
    .cs-card:hover { transform: translateY(-5px); border-color: #06d6f0; box-shadow: 0 10px 30px rgba(6,214,240,0.2); }
    .cs-card-img { height: 220px; background-size: cover; background-position: center; }
    .cs-card-content { padding: 25px; }
    .cs-card-tags { margin-bottom: 15px; }
    .cs-card-tags .tag { display: inline-block; padding: 4px 10px; background: rgba(6,214,240,0.1); color: #06d6f0; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-right: 10px; }
    .cs-card h3 { font-size: 1.4rem; margin-bottom: 10px; }
    .cs-card p { opacity: 0.8; font-size: 0.95rem; margin-bottom: 20px; }
    .cs-card-link { color: #7c3aed; font-weight: 600; }
  </style>
</head>
<body class="dark-theme">

  <div id="site-nav"></div>

  <main>
    <section class="page-hero">
      <div class="page-hero-glow"></div>
      <div class="container">
        <h1 class="page-hero-title">Our Work & <span class="gradient-text">Case Studies</span></h1>
        <p class="page-hero-sub">Discover how we've helped businesses across the UK scale their traffic and revenue.</p>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="cs-hub-grid">
          ${cardsHtml}
        </div>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="js/shared.js"></script>
</body>
</html>`;
    fs.writeFileSync(path.join(baseDir, "case-studies.html"), html, 'utf8');
    console.log("Generated case-studies.html");
}

generateIndividualPages();
generateHubPage();
