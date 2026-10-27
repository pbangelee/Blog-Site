/* About Us: a short welcome, four photo tiles, and a viewer for each group of family photographs.
   No identity or relationship labels are inferred. */
window.JournalFamilyAlbum=(()=>{
  const photos=window.JOURNAL_FAMILY_PHOTOS||[],groups=window.JOURNAL_FAMILY_GROUPS||[];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Which photograph fronts each tile (a photo number from family-photos.js; the first photo of the group is used if none is set)
  const covers={us:0,'original-kids':8,grandkids:12};

  function markup(config={}){
    if(!photos.length)return '<section class="container narrow page-head"><h1>About Us</h1><p>Lorem ipsum dolor sit amet.</p></section>';
    const hero=(config.aboutPhoto&&photos.find(p=>p.src===config.aboutPhoto))||photos.find(p=>p.id==="family-01")||photos[0];
    const tiles=groups.filter(g=>g.photos.length).map(g=>{
      const p=photos[covers[g.id]??g.photos[0]]||photos[g.photos[0]],n=g.photos.length;
      return `<button type="button" class="about-tile" data-open-group="${esc(g.id)}" aria-label="${esc(g.title)}, ${n} ${n===1?'photograph':'photographs'}. Open the photographs.">
        <span class="about-tile-photo"><img src="${esc(p.thumb)}" srcset="${esc(p.thumb)} ${p.smallWidth}w, ${esc(p.src)} ${p.largeWidth}w" sizes="(max-width:900px) 46vw, 280px" width="${p.width}" height="${p.height}" alt="" loading="lazy" decoding="async"></span>
        <span class="about-tile-label"><span class="about-tile-name">${esc(g.title)}</span><span class="about-tile-count">${n} ${n===1?'photo':'photos'} <span aria-hidden="true">→</span></span></span>
      </button>`;}).join('');
    return `<div class="about-page">
      <header class="container about-welcome">
        <div class="about-welcome-copy">
          <p class="eyebrow">Hello, friends</p>
          <h1>About Us</h1>
          <p class="about-lede">${esc(config.aboutHeading||'Lorem ipsum dolor sit amet.')}</p>
          <div class="about-letter">${(config.aboutParagraphs||['Lorem ipsum dolor sit amet.']).map(t=>`<p>${esc(t)}</p>`).join('')}<p class="about-sign">${esc(config.aboutNames||'Lorem & Ipsum')}</p></div>
          <a class="family-album-link" href="#our-family">Meet our family <span aria-hidden="true">↓</span></a>
        </div>
        ${hero?`<figure class="about-welcome-photo"><img src="${esc(hero.src)}" width="${hero.width}" height="${hero.height}" alt="${esc(hero.alt)}" fetchpriority="high" decoding="async"></figure>`:''}
      </header>
      <section class="container about-people" id="our-family" aria-labelledby="about-people-heading">
        <div class="about-people-head"><div><p class="eyebrow">The people along the way</p><h2 id="about-people-heading">Our family</h2></div></div>
        <div class="about-tiles">${tiles}</div>
      </section>
      <section class="container narrow about-signoff">
        <span class="about-hand">Along the way, together.</span>
        <p>${esc(config.familyClosing||'Lorem ipsum dolor sit amet.')}</p>
        <a class="btn" href="chapters.html">Continue to the journey <span aria-hidden="true">↗</span></a>
        
      </section>
    </div>
    <dialog id="family-viewer" class="family-viewer" aria-labelledby="family-viewer-heading"><div class="family-viewer-toolbar"><h2 id="family-viewer-heading">Family photograph</h2><button type="button" id="family-viewer-close" class="v-btn">Close ×</button></div><p id="family-viewer-count" role="status" aria-live="polite"></p><figure><img id="family-viewer-image" alt=""><figcaption id="family-viewer-caption"></figcaption></figure><p id="family-photo-error" role="alert" hidden>This photograph could not load. <button type="button" id="family-photo-retry" class="v-btn">Try again</button></p><div class="family-viewer-controls"><button type="button" id="family-viewer-prev" class="v-btn">← Previous</button><button type="button" id="family-viewer-next" class="v-btn">Next →</button></div></dialog>`;
  }

  function bind(){
    const $=s=>document.querySelector(s),dialog=$('#family-viewer');if(!dialog)return;
    const image=$('#family-viewer-image');let index=0,opener=null,touch=null,viewerGroup=groups[0]?.id,active=[];
    function show(next){
      const position=((next%active.length)+active.length)%active.length;index=active[position];const p=photos[index];
      $('#family-viewer-prev').disabled=active.length<2;$('#family-viewer-next').disabled=active.length<2;
      $('#family-photo-error').hidden=true;image.hidden=false;image.src=p.src;image.alt=p.alt;
      $('#family-viewer-caption').textContent=p.caption||'';
      $('#family-viewer-heading').textContent=groups.find(g=>g.id===viewerGroup)?.title||'Family photograph';
      $('#family-viewer-count').textContent=`Photo ${position+1} of ${active.length}`;
    }
    function openGroup(id,trigger){
      const g=groups.find(x=>x.id===id);if(!g||!g.photos.length)return;
      opener=trigger||null;viewerGroup=id;active=[...g.photos];show(0);if(!dialog.open)dialog.showModal();
    }
    document.querySelectorAll('[data-open-group]').forEach(b=>b.addEventListener('click',()=>openGroup(b.dataset.openGroup,b)));
    $('#family-viewer-close').onclick=()=>dialog.close();
    $('#family-viewer-prev').onclick=()=>show(active.indexOf(index)-1);
    $('#family-viewer-next').onclick=()=>show(active.indexOf(index)+1);
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>opener?.focus());
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();show(active.indexOf(index)+(e.key==='ArrowLeft'?-1:1));}});
    image.addEventListener('error',()=>{image.hidden=true;$('#family-photo-error').hidden=false;});
    $('#family-photo-retry').onclick=()=>show(active.indexOf(index));
    image.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
    image.addEventListener('touchend',e=>{if(!touch||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)show(active.indexOf(index)+(dx<0?1:-1));touch=null;},{passive:true});
    image.addEventListener('touchcancel',()=>touch=null,{passive:true});
    // Links from the homepage stack (about.html?group=...) open that group straight away
    try{const g=new URLSearchParams(location.search).get('group');if(g)openGroup(g,document.querySelector(`[data-open-group="${CSS.escape(g)}"]`));}catch(e){}
  }
  return {markup,bind};
})();
