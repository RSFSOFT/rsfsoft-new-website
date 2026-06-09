# RSF Soft — Bulk HTML Performance Optimizer
# Applies render-blocking resource removal, font preloading, critical CSS injection,
# and deferred script loading to all HTML pages in the site root.

$base = "c:\Users\HP\Desktop\RSFSOFT New Website"
$files = Get-ChildItem $base -Filter "*.html" -File

# Skip index.html as it was manually optimized
$skipFiles = @("index.html")

$criticalHeadBlock = @'
  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <!-- Preload Outfit font non-blocking -->
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap"></noscript>
  <!-- Inline Critical CSS -->
  <style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{font-size:16px}body{font-family:'Outfit',system-ui,sans-serif;background:#04070f;color:#f0f6ff;line-height:1.7;overflow-x:hidden}a{text-decoration:none;color:inherit}ul{list-style:none}img{max-width:100%;display:block;height:auto}#three-canvas{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none}.top-bar{position:relative;z-index:100;background:linear-gradient(90deg,rgba(124,58,237,.9),rgba(6,214,240,.8));padding:9px 0;text-align:center;font-size:.8rem;font-weight:600;color:#fff}.top-bar-ticker{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}.ticker-sep{opacity:.3}.navbar{position:sticky;top:0;z-index:1000;background:rgba(4,7,15,.75);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.07)}.nav-container{max-width:1300px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:74px}.nav-logo img{height:46px;width:auto}.nav-menu{display:flex;align-items:center;gap:4px}.nav-link{padding:9px 15px;border-radius:10px;font-size:.88rem;font-weight:500;color:#94a3b8}.nav-cta{background:linear-gradient(135deg,#7c3aed,#06d6f0)!important;color:#fff!important;padding:10px 24px!important;border-radius:40px!important;font-weight:700!important}.page-hero{position:relative;padding:140px 0 80px;z-index:1;text-align:center}.page-hero-badge{display:inline-block;background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);color:#7c3aed;font-size:.75rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 18px;border-radius:40px;margin-bottom:20px}.page-hero-title{font-size:clamp(2rem,5vw,4rem);font-weight:900;line-height:1.1;margin-bottom:16px}.page-hero-sub{font-size:1rem;color:#94a3b8;max-width:620px;margin:0 auto 28px;line-height:1.8}.page-hero-actions{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:24px}.breadcrumb{font-size:.82rem;color:#94a3b8}.breadcrumb a{color:#7c3aed}.container{max-width:1300px;margin:0 auto;padding:0 28px}.btn-primary-3d{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:linear-gradient(135deg,#7c3aed,#06d6f0);color:#fff;font-size:.95rem;font-weight:700;border:none;border-radius:50px;cursor:pointer;font-family:inherit}.btn-glass{display:inline-flex;align-items:center;gap:10px;padding:16px 34px;background:rgba(255,255,255,.05);color:#f0f6ff;font-size:.95rem;font-weight:600;border:1px solid rgba(255,255,255,.12);border-radius:50px;cursor:pointer;font-family:inherit}.gradient-text{background:linear-gradient(135deg,#7c3aed,#a855f7 40%,#06d6f0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}@media(max-width:768px){.hero-content{grid-template-columns:1fr}.hero-visual,.hero-visual-inner{display:none}#three-canvas{display:none}.nav-menu{display:none}.nav-toggle{display:flex}}</style>
'@

$deferredScripts = @'

<!-- Load Three.js deferred - desktop only -->
<script>
if(window.innerWidth>768&&!('ontouchstart' in window)){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';s.onload=function(){if(window.initThreeBackground)window.initThreeBackground();};document.body.appendChild(s);}else{var c=document.getElementById('three-canvas');if(c)c.style.display='none';}
</script>
<script src="js/perf.js" defer></script>
'@

$changedCount = 0
$skippedCount = 0

foreach ($file in $files) {
    # Skip small redirect files and manually optimized index.html
    if ($file.Length -lt 2000 -or $skipFiles -contains $file.Name) {
        Write-Host "Skipped (small/exempt): $($file.Name)" -ForegroundColor Yellow
        $skippedCount++
        continue
    }

    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $content

    # 1. Remove render-blocking Font Awesome link from head
    $modified = $modified -replace '<link\s+rel="stylesheet"\s+href="https://cdnjs\.cloudflare\.com/ajax/libs/font-awesome/6\.5\.0/css/all\.min\.css"[^>]*>', ''

    # 2. Remove render-blocking Three.js script from head
    $modified = $modified -replace '<script\s+src="https://cdnjs\.cloudflare\.com/ajax/libs/three\.js/r128/three\.min\.js"\s*>\s*</script>', ''

    # 3. Remove render-blocking VanillaTilt from head
    $modified = $modified -replace '<script\s+src="https://cdnjs\.cloudflare\.com/ajax/libs/vanilla-tilt/1\.7\.2/vanilla-tilt\.min\.js"\s*>\s*</script>', ''

    # 4. Remove existing Google Fonts blocking link
    $modified = $modified -replace '<link\s+href="https://fonts\.googleapis\.com/css2[^"]+"\s+rel="stylesheet"[^>]*>', ''
    $modified = $modified -replace '<link\s+rel="stylesheet"\s+href="https://fonts\.googleapis\.com[^"]+"[^>]*>', ''
    # Also remove old preconnect lines if present (we'll add them back via criticalHeadBlock)
    $modified = $modified -replace '\s*<link\s+rel="preconnect"\s+href="https://fonts\.googleapis\.com"[^>]*>\s*\n?', "`n"
    $modified = $modified -replace '\s*<link\s+rel="preconnect"\s+href="https://fonts\.gstatic\.com"[^>]*>\s*\n?', "`n"

    # 5. Inject critical head block right after <head> tag
    if ($modified -notmatch 'rel="preload" as="style"') {
        $modified = $modified -replace '(<head>)', "`$1`n$criticalHeadBlock"
    }

    # 6. Add lazy loading to non-critical images (not first img, not logos, not already having loading attr)
    # Skip the first img tag (likely LCP/hero image) - add loading=lazy to all others
    $imgCount = 0
    $modified = [regex]::Replace($modified, '<img(?![^>]*loading=)([^>]*)>', {
        param($match)
        $script:imgCount++
        if ($script:imgCount -eq 1) {
            # First image: add fetchpriority="high" for LCP
            return '<img fetchpriority="high"' + $match.Groups[1].Value + '>'
        } else {
            return '<img loading="lazy"' + $match.Groups[1].Value + '>'
        }
    })

    # 7. Add deferred script loader before </body> (only if not already added)
    if ($modified -notmatch 'perf\.js') {
        $modified = $modified -replace '(</body>)', "$deferredScripts`n`$1"
    }

    # Save only if changed
    if ($modified -ne $content) {
        Set-Content $file.FullName $modified -Encoding UTF8
        Write-Host "Optimized: $($file.Name)" -ForegroundColor Green
        $changedCount++
    } else {
        Write-Host "No changes needed: $($file.Name)" -ForegroundColor Cyan
        $skippedCount++
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  Optimization Complete!" -ForegroundColor Magenta
Write-Host "  Files optimized : $changedCount" -ForegroundColor Green
Write-Host "  Files skipped   : $skippedCount" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Magenta
