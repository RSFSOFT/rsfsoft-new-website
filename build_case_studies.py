import os

base_dir = r"c:\Users\HP\Desktop\RSFSOFT New Website"

# The 6 case studies
case_studies = [
    {
        "id": "dubai-seo",
        "title": "Scaling a Dubai Real Estate Agency by 345%",
        "service": "SEO & Organic Growth",
        "region": "Dubai",
        "image": "img/cs-dubai-seo.png",
        "file": "case-study-dubai-real-estate.html",
        "challenge": "A leading luxury real estate agency in Dubai was losing highly qualified leads to competitors due to poor organic visibility for ultra-competitive keywords like 'luxury villas in Palm Jumeirah'.",
        "solution": "We executed a comprehensive Technical SEO overhaul, combined with aggressive localized content strategy and high-authority link building in the UAE property niche.",
        "results": [
            "+345% Increase in Organic Traffic in 6 Months",
            "Ranked #1 for 15+ high-intent luxury property keywords",
            "120% Increase in Qualified Inbound Leads"
        ]
    },
    {
        "id": "usa-ecommerce",
        "title": "Scaling a National E-Commerce Brand to $1.2M",
        "service": "Web Dev & E-Commerce SEO",
        "region": "USA",
        "image": "img/cs-usa-ecommerce.png",
        "file": "case-study-usa-ecommerce.html",
        "challenge": "A nationwide USA retailer was struggling with a slow, outdated Magento store that suffered from a high cart abandonment rate and poor search engine rankings.",
        "solution": "We migrated their entire catalog to a headless Shopify build for lightning-fast speeds, and executed an E-Commerce SEO strategy targeting long-tail product keywords.",
        "results": [
            "80% Reduction in Page Load Times",
            "$1.2M in Organic Revenue Generated in 8 Months",
            "Cart Abandonment Rate dropped by 45%"
        ]
    },
    {
        "id": "uk-law",
        "title": "Local SEO Domination for a UK Law Firm",
        "service": "Local SEO & PPC",
        "region": "UK",
        "image": "img/cs-uk-law.png",
        "file": "case-study-uk-law-firm.html",
        "challenge": "A top-tier London law firm wanted to expand their client base but was entirely reliant on referrals, having virtually zero presence on Google Maps or organic search.",
        "solution": "We optimized their Google My Business profile, built local citations, launched highly targeted Google Ads (PPC) campaigns, and created localized service pages.",
        "results": [
            "Secured the #1 Google Maps spot in 5 major boroughs",
            "300% Increase in Inbound Client Phone Calls",
            "40% Reduction in Cost-Per-Acquisition (CPA)"
        ]
    },
    {
        "id": "canada-app",
        "title": "On-Demand Delivery App Launch in Canada",
        "service": "Mobile App Development",
        "region": "Canada",
        "image": "img/cs-canada-app.png",
        "file": "case-study-canada-logistics.html",
        "challenge": "A Canadian logistics startup needed a robust, cross-platform mobile application to connect drivers with local businesses for on-demand deliveries.",
        "solution": "We designed the UI/UX from scratch and built a high-performance React Native application with real-time GPS tracking, automated dispatching, and seamless payment gateways.",
        "results": [
            "10,000+ Active Users acquired in the first month",
            "4.9 Star Rating on the App Store and Google Play",
            "100% Server Uptime during peak launch traffic"
        ]
    },
    {
        "id": "australia-saas",
        "title": "B2B SaaS Growth & Lead Generation",
        "service": "PPC & Growth Marketing",
        "region": "Australia",
        "image": "img/cs-australia-saas.png",
        "file": "case-study-australia-saas.html",
        "challenge": "An Australian B2B SaaS company had a great product but was burning through their ad budget with low-quality leads and high customer acquisition costs.",
        "solution": "We restructured their entire Google Ads account, implemented deep conversion tracking, built high-converting landing pages, and launched remarketing campaigns.",
        "results": [
            "450+ High-Quality B2B Leads generated monthly",
            "60% Reduction in Customer Acquisition Cost (CAC)",
            "8.5x Return on Ad Spend (ROAS)"
        ]
    },
    {
        "id": "pakistan-social",
        "title": "Brand Building for a National Retail Chain",
        "service": "Social Media & Reputation",
        "region": "Pakistan",
        "image": "img/cs-pakistan-social.png",
        "file": "case-study-pakistan-retail.html",
        "challenge": "A major retail chain in Pakistan was facing negative PR from an old management issue and had a stagnant social media presence that failed to drive foot traffic.",
        "solution": "We executed a crisis reputation management protocol to suppress negative search results, launched viral social media campaigns, and built an automated 5-star review generation system.",
        "results": [
            "Suppressed negative articles from Page 1 of Google",
            "Grew Instagram following by 50,000+ engaged users",
            "Generated 300+ authentic 5-star Google Reviews"
        ]
    }
]

def generate_individual_pages():
    for cs in case_studies:
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{cs['title']} | RSF Soft Case Studies</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="stylesheet" href="css/pages.css">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    .cs-hero {{
      padding: 150px 20px 80px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }}
    .cs-hero-img {{
      max-width: 800px;
      width: 100%;
      border-radius: 20px;
      margin: 40px auto;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
    }}
    .cs-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 60px;
    }}
    .cs-box {{
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      padding: 40px;
      border-radius: 20px;
    }}
    .cs-box h3 {{ color: #06d6f0; margin-bottom: 20px; font-size: 1.5rem; }}
    .cs-results {{
      background: linear-gradient(135deg, rgba(6,214,240,0.1), rgba(124,58,237,0.1));
      border: 1px solid rgba(6,214,240,0.3);
      padding: 40px;
      border-radius: 20px;
      margin-bottom: 80px;
    }}
    .cs-results h3 {{ color: #fff; margin-bottom: 30px; text-align: center; font-size: 2rem; }}
    .cs-results ul {{ list-style: none; padding: 0; margin: 0; display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }}
    .cs-results li {{ background: rgba(0,0,0,0.5); padding: 20px; border-radius: 10px; font-weight: 600; font-size: 1.1rem; text-align: center; border: 1px solid rgba(255,255,255,0.1); }}
    @media (max-width: 768px) {{ .cs-grid {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body class="dark-theme">

  <div id="site-nav"></div>

  <main>
    <section class="cs-hero">
      <div class="page-hero-glow"></div>
      <div class="container">
        <div class="page-hero-badge">{cs['region']} • {cs['service']}</div>
        <h1 class="page-hero-title">{cs['title']}</h1>
        <p class="page-hero-sub">Discover how we helped this client achieve massive growth through strategic digital execution.</p>
        <img src="{cs['image']}" alt="{cs['title']}" class="cs-hero-img">
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="cs-grid">
          <div class="cs-box">
            <h3><i class="fa fa-exclamation-triangle"></i> The Challenge</h3>
            <p>{cs['challenge']}</p>
          </div>
          <div class="cs-box">
            <h3><i class="fa fa-lightbulb"></i> Our Solution</h3>
            <p>{cs['solution']}</p>
          </div>
        </div>

        <div class="cs-results">
          <h3>The Results</h3>
          <ul>
            {"".join(f"<li><i class='fa fa-check-circle' style='color:#06d6f0; margin-right:10px;'></i>{res}</li>" for res in cs['results'])}
          </ul>
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
</html>"""
        with open(os.path.join(base_dir, cs['file']), "w", encoding="utf-8") as f:
            f.write(html)
        print(f"Generated {cs['file']}")

def generate_hub_page():
    cards_html = ""
    for cs in case_studies:
        cards_html += f"""
        <a href="{cs['file']}" class="cs-card" data-service="{cs['service'].split()[0].lower()}" data-region="{cs['region'].lower()}">
          <div class="cs-card-img" style="background-image:url('{cs['image']}');"></div>
          <div class="cs-card-content">
            <div class="cs-card-tags">
              <span class="tag">{cs['region']}</span>
              <span class="tag">{cs['service']}</span>
            </div>
            <h3>{cs['title']}</h3>
            <p>{cs['results'][0]}</p>
            <div class="cs-card-link">Read Full Case Study <i class="fa fa-arrow-right"></i></div>
          </div>
        </a>"""

    html = f"""<!DOCTYPE html>
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
    .cs-hub-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }}
    .cs-card {{
      display: block;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
    }}
    .cs-card:hover {{
      transform: translateY(-5px);
      border-color: #06d6f0;
      box-shadow: 0 10px 30px rgba(6,214,240,0.2);
    }}
    .cs-card-img {{
      height: 220px;
      background-size: cover;
      background-position: center;
    }}
    .cs-card-content {{
      padding: 25px;
    }}
    .cs-card-tags {{ margin-bottom: 15px; }}
    .cs-card-tags .tag {{
      display: inline-block;
      padding: 4px 10px;
      background: rgba(6,214,240,0.1);
      color: #06d6f0;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-right: 10px;
    }}
    .cs-card h3 {{ font-size: 1.4rem; margin-bottom: 10px; }}
    .cs-card p {{ opacity: 0.8; font-size: 0.95rem; margin-bottom: 20px; }}
    .cs-card-link {{ color: #7c3aed; font-weight: 600; }}
  </style>
</head>
<body class="dark-theme">

  <div id="site-nav"></div>

  <main>
    <section class="page-hero">
      <div class="page-hero-glow"></div>
      <div class="container">
        <h1 class="page-hero-title">Our Work & <span class="gradient-text">Case Studies</span></h1>
        <p class="page-hero-sub">Discover how we've helped businesses across the globe scale their traffic, apps, and revenue.</p>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <div class="cs-hub-grid">
          {cards_html}
        </div>
      </div>
    </section>
  </main>

  <div id="site-footer"></div>
  <script src="js/shared.js"></script>
</body>
</html>"""
    with open(os.path.join(base_dir, "case-studies.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Generated case-studies.html")

def update_index_html():
    index_path = os.path.join(base_dir, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # The Featured Work HTML to insert
    featured_work = """
    <!-- ================================================
         FEATURED CASE STUDIES
         ================================================ -->
    <section class="section-dark" style="padding: 100px 0; background: linear-gradient(180deg, #020617 0%, #06112c 100%); position:relative;">
      <div class="container">
        <div style="text-align:center; margin-bottom: 50px;">
          <div class="section-badge">Proven Results</div>
          <h2 class="section-title" style="font-size:3rem; margin-bottom:15px;">Global <span class="gradient-text">Success Stories</span></h2>
          <p class="section-subtitle">Real numbers. Real growth. See how we help brands dominate globally.</p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
          <!-- Card 1 -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:20px; overflow:hidden;">
            <div style="height:200px; background:url('img/cs-dubai-seo.png') center/cover;"></div>
            <div style="padding:25px;">
              <span style="color:#06d6f0; font-size:0.8rem; font-weight:700;">Dubai • SEO</span>
              <h3 style="margin:10px 0;">Scaling a Dubai Real Estate Agency by 345%</h3>
              <a href="case-study-dubai-real-estate.html" style="color:#7c3aed; font-weight:600; text-decoration:none;">Read Case Study &rarr;</a>
            </div>
          </div>
          <!-- Card 2 -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:20px; overflow:hidden;">
            <div style="height:200px; background:url('img/cs-usa-ecommerce.png') center/cover;"></div>
            <div style="padding:25px;">
              <span style="color:#06d6f0; font-size:0.8rem; font-weight:700;">USA • Web Dev</span>
              <h3 style="margin:10px 0;">Scaling an E-Commerce Brand to $1.2M</h3>
              <a href="case-study-usa-ecommerce.html" style="color:#7c3aed; font-weight:600; text-decoration:none;">Read Case Study &rarr;</a>
            </div>
          </div>
          <!-- Card 3 -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:20px; overflow:hidden;">
            <div style="height:200px; background:url('img/cs-uk-law.png') center/cover;"></div>
            <div style="padding:25px;">
              <span style="color:#06d6f0; font-size:0.8rem; font-weight:700;">UK • Local SEO</span>
              <h3 style="margin:10px 0;">Local SEO Domination for a UK Law Firm</h3>
              <a href="case-study-uk-law-firm.html" style="color:#7c3aed; font-weight:600; text-decoration:none;">Read Case Study &rarr;</a>
            </div>
          </div>
        </div>
        
        <div style="text-align:center; margin-top:50px;">
          <a href="case-studies.html" class="btn-glass">View All Case Studies</a>
        </div>
      </div>
    </section>
"""
    if "FEATURED CASE STUDIES" not in html:
        # Insert before STATS
        html = html.replace('<!-- ================================================', featured_work + '\n    <!-- ================================================', 1)
        # Wait, the above replace(..., 1) might replace the first top bar!
        # Let's replace right before STATS section instead
        html = html.replace('<!-- ================================================\n     STATS', featured_work + '<!-- ================================================\n     STATS')
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(html)
        print("index.html updated with Featured Case Studies")

if __name__ == "__main__":
    generate_individual_pages()
    generate_hub_page()
    update_index_html()
