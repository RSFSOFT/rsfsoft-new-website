/* AOS — Scroll entrance animations (enhancement only — content always visible) */
(function(){
  var style = document.createElement('style');
  style.textContent = [
    '.aos-ready{opacity:0!important;transform:translateY(30px)!important;}',
    '.aos-ready.in,.aos-ready.visible{opacity:1!important;transform:translateY(0)!important;}'
  ].join('');
  document.head.appendChild(style);

  /* Mark elements as animation-ready ONLY after a short delay */
  /* This ensures content is rendered first, THEN gets the animation class */
  setTimeout(function(){
    document.querySelectorAll('.aos,.aos-left,.aos-right,.aos-scale').forEach(function(el){
      el.classList.add('aos-ready');
    });
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in','visible'); obs.unobserve(e.target); }
      });
    }, {threshold:0.05, rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('.aos-ready').forEach(function(el){ obs.observe(el); });
  }, 200);
})();