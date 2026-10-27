(async () => {
/* Along the Way: shared page logic. Each page sets <body data-page="..."> */
const J = window.JOURNAL, Journey=window.JournalJourney, config=window.JOURNAL_CONFIG||{};
let visiblePeriods=Journey.visiblePeriods();
let fetching=false;
const $ = (s, el = document) => el.querySelector(s);
let params = new URLSearchParams(location.search);
const browsePage=['entries','gallery','chapter','chapters','story'].includes(document.body.dataset.page);
const browseKey='along-the-way-browse-'+document.body.dataset.page;
if(document.body.dataset.page==='gallery'&&!location.search){try{const saved=sessionStorage.getItem(browseKey);if(saved){params=new URLSearchParams(saved);history.replaceState(null,'','?'+params.toString());}}catch(_){}}
function rememberQuery(url){history.replaceState(null,'',url);try{sessionStorage.setItem(browseKey,url.searchParams.toString());}catch(_){}}


/* ---------- data helpers ---------- */
let chapters = [...J.chapters].sort((a, b) => a.order - b.order);
const chapterById = id => chapters.find(c => c.id === id);
const byDate = (a, b) => a.date.localeCompare(b.date);
// Reading order follows the actual story dates across collections.
let orderedEntries = [...J.entries].sort(byDate);
let newestFirst = [...J.entries].sort((a, b) => byDate(b, a));
const entryUrl = e => e ? `entry.html?id=${encodeURIComponent(e.id)}` : "chapters.html";
const chapterUrl = c => c ? `chapter.html?id=${encodeURIComponent(c.id)}` : "chapters.html";
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const photoIdsOf = e => [e.cover, ...e.body.flatMap(b => b.type === "photo" ? [b.id] : b.type === "group" ? b.ids : [])];
const allPhotos = () => {
  const seen = new Set(), list = [];
  orderedEntries.forEach(e => photoIdsOf(e).forEach(id => {
    if (seen.has(id)) return; seen.add(id);
    if(J.photos[id]&&!J.photos[id].sample&&!J.photos[id].coverOnly)list.push({ ...J.photos[id], id, entry: e, chapter: chapterById(e.chapter) });
  }));
  return list;
};
const themeDrawing = id => {
 const paths=['M17 21Q49 7 83 22L81 68Q50 79 18 66Z','M24 15Q56 10 79 29Q91 58 66 73Q34 83 16 57Q7 33 24 15Z','M18 23Q50 12 82 20L87 61Q52 76 15 65Z'];
 const hash=[...String(id)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,0);
 return `<svg class="theme-drawing" viewBox="0 0 100 90" aria-hidden="true"><path class="theme-wash" d="${paths[hash%3]}"/><path class="theme-outline" d="${paths[hash%3]}"/><path class="theme-scribble" d="M34 44Q48 39 65 44M37 53Q51 49 61 52"/></svg>`;
};
const notFound = (what) => `<div class="container narrow notice"><h1>We couldn't find that ${what}</h1>
  <p>It may have moved or never existed. Let's get you back on the path.</p>
  <p><a class="btn" href="chapters.html">Browse the chapters</a> <a class="btn btn-quiet" href="index.html">Go home</a></p></div>`;

/* ---------- shared header & footer ---------- */

function buildChrome() {
  const page = document.body.dataset.page;
  const shared=window.JournalReader.chrome(page);
  $("#site-header").innerHTML = shared.header;
  $("#site-footer").innerHTML = shared.footer;
  const btn = $(".menu-toggle"), nav = $("#site-nav");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open)); nav.classList.toggle("open", !open);
    btn.textContent = open ? "Menu" : "Close";

  });
  const mobileNav = matchMedia("(max-width: 760px)");
  const syncMenu = () => { nav.inert = mobileNav.matches && btn.getAttribute("aria-expanded") !== "true"; };
  syncMenu(); mobileNav.addEventListener?.("change", () => { if (!mobileNav.matches) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.textContent="Menu"; } syncMenu(); });
  btn.addEventListener("click", syncMenu);
  document.addEventListener("click", e => { if (mobileNav.matches && nav.classList.contains("open") && !e.target.closest("#site-header")) { btn.click(); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { btn.click(); btn.focus(); } });
}

/* ---------- reusable fragments ---------- */
const IMAGE_SIZES = {"images/hero-ocean.jpg": [1800, 1100], "images/chapter-mtc.jpg": [1200, 800], "images/mtc-class.jpg": [800, 1100], "images/chapter-mission.jpg": [1200, 800], "images/market.jpg": [1200, 800], "images/mtc-garden.jpg": [1200, 800], "images/author-placeholder.jpg": [700, 700], "images/mtc-gate.jpg": [1200, 800], "images/market-hills.jpg": [800, 1100], "images/envelope.jpg": [1200, 800], "images/mtc-walk.jpg": [1200, 800], "images/bus-ride.jpg": [1200, 800], "images/arrival.jpg": [1200, 800], "images/packing.jpg": [1200, 800], "images/chapter-before.jpg": [1200, 800]};
const attr = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
const img = (p, cls = "", eager = false) => {
  const dims = IMAGE_SIZES[p.src];
  const responsive = dims ? ` width="${dims[0]}" height="${dims[1]}" srcset="${p.src.replace(/\.jpg$/, '-480.webp')} 480w${dims[0] >= 960 ? `, ${p.src.replace(/\.jpg$/, '-960.webp')} 960w` : ''}" sizes="(max-width: 760px) 100vw, 600px"` : '';
  return `<img class="${cls}" src="${attr(p.src)}" alt="${attr(p.alt)}"${responsive} loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
};
const entryCard = e => `
  <article class="entry-card">
    <a class="entry-card-photo" href="${entryUrl(e)}" tabindex="-1" aria-hidden="true">${J.photos[e.cover]?.sample?`<span class="text-cover" aria-hidden="true">${attr(Journey.forEntry(e)?.title||"Along the Way")}</span>`:img(J.photos[e.cover])}</a>
    <div class="entry-card-text">
      <p class="meta"><time datetime="${e.date}">${fmtDate(e.date)}</time> <span aria-hidden="true">&middot;</span> <a href="entries.html?year=${encodeURIComponent(Journey.forEntry(e)?.id||'')}">${attr(Journey.forEntry(e)?.title||'The Journey')}</a></p>
      <h3><a href="${entryUrl(e)}">${e.title}</a></h3>
      <p>${e.excerpt}</p>
      <a class="read-more" href="${entryUrl(e)}">Read more<span class="sr-only"> about ${e.title}</span></a>
    </div>
  </article>`;
const periodCard = p => {
 const list=newestFirst.filter(e=>Journey.inPeriod(e,p.id));
 const photo=list.map(e=>J.photos[e.cover]).find(ph=>ph&&!ph.sample);
 return `<a class="year-card" href="entries.html?year=${encodeURIComponent(p.id)}&sort=oldest">${photo?img(photo):`<div class="year-mark" aria-hidden="true">${p.id==='before'?'The beginning':(/year-\d+$/.test(p.id)?p.id.slice(-1).padStart(2,'0'):'Along the Way')}</div>`}<div class="year-card-copy"><h3>${attr(p.title)}</h3><p>${attr(p.description)}</p><span class="journey-count-badge">${fetching?'Explore stories':list.length?`${list.length} ${list.length===1?'entry':'entries'}`:'Stories to come'} <span aria-hidden="true">↗</span></span></div></a>`;
};
const figure = (p, cls = "") => !p||p.sample ? "" : `<figure class="${cls}">${img(p, "", cls === "cover")}${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}</figure>`;


/* ---------- page renderers ---------- */
const pages = {
  home() {
    const usedThemes=Journey.themes.filter(id=>newestFirst.some(e=>(e.themes||[]).includes(id)));
    const real=allPhotos().slice(-12).reverse();
    const familyPhotos=window.JOURNAL_FAMILY_PHOTOS||[];
    const welcomePhoto=familyPhotos.find(p=>p.src===config.welcomePhoto);
    const familyImage=(p,{eager=false,sizes='(max-width:760px) 40vw, 240px'}={})=>`<img src="${attr(eager?p.src:p.thumb)}" srcset="${attr(p.thumb)} ${p.smallWidth}w, ${attr(p.src)} ${p.largeWidth}w" sizes="${sizes}" width="${p.width}" height="${p.height}" alt="${attr(p.alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
    const arrow='';
    const heroBase=config.heroPhoto||'images/hero/home';
    const heroPhotoHtml=config.welcomePhoto?`<div class="journal-opening-photos hero-photo-wrap"><img class="hero-photo" src="${attr(heroBase)}-1600.webp" srcset="${attr(heroBase)}-900.webp 900w, ${attr(heroBase)}-1600.webp 1600w, ${attr(heroBase)}-2560.webp 2560w" sizes="100vw" width="2560" height="1707" alt="${attr(config.welcomePhotoAlt||'')}" fetchpriority="high" decoding="async"></div>`:'';
    const opening=`<section class="journal-opening photo-led-opening hero-motion ${config.welcomePhoto?'':'without-photo'}" aria-labelledby="home-title">
      ${heroPhotoHtml}
      <div class="photo-led-copy"><h1 id="home-title"><picture><source media="(max-width:760px)" srcset="images/brand/logo-stacked-light.svg"><img class="hero-logo" src="images/brand/logo-horizontal-light.svg" alt="Along the Way" width="1806" height="476" fetchpriority="high"></picture></h1></div>
      <p class="hero-subtitle">A journey of faith, family, and service.</p>
      <a class="hero-explore" href="#stories"><span class="hero-explore-label">Explore the journal</span><span class="hero-explore-line" aria-hidden="true"></span></a>
    </section>`;

    const today=new Date();
    const current=Journey.periodFor(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`);
    const journey=visiblePeriods.length?`<section class="journal-journey-band" aria-labelledby="home-journey-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">One journey, many moments</p><h2 id="home-journey-title">The journey so far<span class="hand">…and still becoming.</span></h2></div><a class="journal-text-link" href="chapters.html">Explore the journey ${arrow}</a></div><ol class="journal-journey-list">${visiblePeriods.map((p,i)=>{const list=newestFirst.filter(e=>Journey.inPeriod(e,p.id));const photo=list.map(e=>J.photos[e.cover]).find(ph=>ph&&!ph.sample);return `<li><a href="entries.html?year=${encodeURIComponent(p.id)}&sort=oldest"${current?.id===p.id?' class="is-current"':''}><span class="journey-step" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span class="journey-step-copy">${photo?img(photo,'journey-stop-photo'):''}<span class="journey-step-title">${attr(p.title)}</span><span class="journey-step-description">${attr(p.description||'Explore this part of the journey.')}</span><span class="journey-entry-count"><b>${list.length}</b> ${list.length===1?'entry':'entries'}</span>${current?.id===p.id?'<span class="journey-now">We’re here</span>':''}</span><span class="journey-step-arrow" aria-hidden="true">↗</span></a></li>`;}).join('')}</ol></div></section>`:'';
    const themeExplorer=usedThemes.length?`<section class="journal-theme-explorer" aria-labelledby="home-themes-title"><div class="container"><div class="journal-theme-intro"><p class="eyebrow">What we’re learning</p><h2 id="home-themes-title">What we’re learning along the way</h2><p>Explore by themes.</p></div><div class="journal-theme-links">${usedThemes.map(t=>{const count=newestFirst.filter(e=>(e.themes||[]).includes(t)).length;return `<a href="entries.html?theme=${encodeURIComponent(t)}" style="--theme-color:${Journey.themeColor(t)}">${themeDrawing(t)}<span class="journal-theme-name">${attr(Journey.themeName(t))}</span><span class="journal-theme-count"><span class="theme-count-number" data-count="${count}" aria-hidden="true">${count}</span><span class="sr-only">${count}</span> <span class="theme-count-label">${count===1?'story':'stories'}</span></span></a>`;}).join('')}</div></div></section>`:'';
    const stackItems=[{id:'original-kids',idx:8,label:'Our children'},{id:'grandkids',idx:12,label:'Our grandkids'}].filter(it=>familyPhotos[it.idx]);
    const stackGroups=window.JOURNAL_FAMILY_GROUPS||[];
    const familyCollage=familyPhotos.length&&stackItems.length?`<section class="container home-family-preview" aria-labelledby="home-family-title"><div class="home-family-copy"><p class="eyebrow">The people along the way</p><h2 id="home-family-title">A little more <br>about <em>us.</em></h2><p>Meet our family, one photograph at a time.</p><a class="family-album-link" href="about.html#our-family">Open our family album ${arrow}</a></div><div class="home-family-stack"><div class="polaroid-stack" data-stack role="group" aria-label="Family photographs, stacked like prints on a table">${stackItems.map((it,i)=>{const n=(stackGroups.find(g=>g.id===it.id)?.photos||[]).length;return `<a class="polaroid" style="--i:${i};--tape:${['rgba(166,79,55,.32)','rgba(110,140,120,.38)','rgba(120,140,190,.34)'][i%3]}" data-pos="${i}" data-label="${attr(it.label)}" href="about.html?group=${it.id}#our-family" aria-label="${attr(it.label)}${n?`, ${n} photographs`:''}. ${i===0?'Open this group in the family album.':'Bring to the front.'}"><span class="polaroid-photo">${familyImage(familyPhotos[it.idx],{sizes:'(max-width:760px) 60vw, 320px'})}</span><span class="polaroid-caption"><span class="polaroid-name">${attr(it.label)}</span>${n?`<span class="polaroid-count">${n} ${n===1?'photo':'photos'}</span>`:''}</span></a>`;}).join('')}</div><div class="stack-hint"><button type="button" class="stack-shuffle" data-shuffle><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h3.5c3 0 4.5 2 6 5s3 5 6 5H21"/><path d="M3 17h3.5c1.6 0 2.8-.6 3.8-1.6M13.5 8.6C14.6 7.6 15.9 7 17.5 7H21"/><path d="m18.5 4.5 2.5 2.5-2.5 2.5M18.5 14.5l2.5 2.5-2.5 2.5"/></svg><span>Shuffle the stack</span></button><span class="sr-only" aria-live="polite" data-stack-status></span></div></div></section>`:'';
    const content=`<section class="container home-latest" id="stories" aria-labelledby="home-stories-title"><div class="section-heading"><div><p class="eyebrow">The journal</p><h2 id="home-stories-title">Latest entry</h2></div><a class="journal-text-link" href="entries.html">View all entries ${arrow}</a></div><div class="journal-story-grid" id="home-entry-list"></div></section>
    ${themeExplorer}${journey}${familyCollage}
    ${real.length?`<section class="container journal-photo-shelf" aria-labelledby="home-photos-title"><div class="section-heading"><div><p class="eyebrow">Little glimpses</p><h2 id="home-photos-title">Life between the lines.</h2></div><a class="journal-text-link" href="gallery.html">All photographs ${arrow}</a></div><div class="life-strip" data-strip><div class="life-track" data-track tabindex="0" role="region" aria-label="Photographs from the journal. Scroll sideways to see more.">${real.map((p,i)=>{const t=p.entry?.titleText||p.entry?.title||'From the journal';const d=p.entry?.date?new Date(p.entry.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'';return `<a class="life-card" style="--r:${[-1.6,1.2,-.8,1.8,-1.2,.9][i%6]}deg" href="${p.entry?.id?`entry.html?id=${encodeURIComponent(p.entry.id)}`:`gallery.html?photo=${encodeURIComponent(p.id)}`}" aria-label="Read journal entry: ${attr(t)}"><span class="life-photo">${img(p)}</span><span class="life-caption"><span class="life-title">Read the story ↗</span></span></a>`;}).join('')}</div><div class="life-controls" data-controls><span class="life-hint">Drag or swipe</span><div class="life-progress" aria-hidden="true"><span data-progress></span></div><div class="life-arrows"><button type="button" class="life-arrow" data-dir="-1" aria-label="Previous photographs"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 6-6 6 6 6"/></svg></button><button type="button" class="life-arrow" data-dir="1" aria-label="Next photographs"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9.5 6 6 6-6 6"/></svg></button></div></div></div></section>`:''}
    `;
    // Keep the opening node in place when published stories arrive. The title,
    // photos, and keyboard focus must not restart after a fetch.
    const existing=document.getElementById('journal-content');
    if(existing){existing.innerHTML=content;}else{
      $('#main').innerHTML=opening+'<div id="journal-content">'+content+'</div>';

    }

    function storyCard(e,index){
      const photo=J.photos[e.cover],hasPhoto=photo&&!photo.sample;
      return `<article class="journal-story ${index===0?'journal-story-featured':'journal-story-small'} ${hasPhoto?'':'journal-story-text'}"><a class="journal-story-image" href="${entryUrl(e)}" tabindex="-1" aria-hidden="true">${hasPhoto?img(photo):`<span class="journal-paper-cover"><span>Along the Way</span><span>${attr(Journey.forEntry(e)?.title||'From the journal')}</span></span>`}${index===0?'<span class="journal-latest-label">Latest entry</span>':''}</a><div class="journal-story-copy"><p class="meta"><time datetime="${attr(e.date)}">${fmtDate(e.date)}</time>${Journey.forEntry(e)?` <span aria-hidden="true">·</span> ${attr(Journey.forEntry(e).title)}`:''}</p><h3><a href="${entryUrl(e)}">${e.title}</a></h3><p class="journal-story-excerpt">${e.excerpt||''}</p><a class="journal-text-link" href="${entryUrl(e)}">Continue reading <span aria-hidden="true">→</span><span class="sr-only">: ${e.title}</span></a></div></article>`;
    }
    $('#home-entry-list').innerHTML=newestFirst.slice(0,3).map(storyCard).join('')||`<div class="journal-empty"><span class="hand">A new page is waiting.</span><p>${fetching?'The latest stories will appear here shortly.':'The first stories will appear here as they are shared.'}</p><a class="journal-text-link" href="about.html#our-family">Visit our family album ${arrow}</a></div>`;
    if(newestFirst.length>1){
      const card=document.createElement('aside');card.className='surprise-card';
      card.innerHTML=`<div class="surprise-copy"><p class="surprise-kicker">Not sure where to start?</p><p class="surprise-text">Let the journal choose for you. One story, picked at random.</p></div><a class="surprise-btn" href="entries.html"><span class="surprise-dice" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.6" cy="8.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8.6" r="1.05" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none"/><circle cx="8.6" cy="15.4" r="1.05" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.05" fill="currentColor" stroke="none"/></svg></span><span class="surprise-label">Read a random entry</span></a>`;
      const btn=card.querySelector('.surprise-btn');
      const pick=()=>{btn.href=entryUrl(newestFirst[Math.floor(Math.random()*newestFirst.length)]);};
      pick();['focus','mouseenter','touchstart'].forEach(ev=>btn.addEventListener(ev,pick,{passive:true}));
      btn.addEventListener('click',e=>{
        pick();
        if(matchMedia('(prefers-reduced-motion: reduce)').matches||btn.classList.contains('is-rolling'))return;
        e.preventDefault();const url=btn.href;btn.classList.add('is-rolling');setTimeout(()=>{location.href=url;},600);
      });
      $('#home-entry-list').after(card);
    }

  },

  story() { pages.about(); },

  entries() {
    const usedThemes=Journey.themes.filter(id=>newestFirst.some(e=>(e.themes||[]).includes(id)));
    const period=visiblePeriods.find(p=>p.id===params.get('year'));
    $('#main').innerHTML=`<div class="container narrow page-head"><p class="eyebrow">The journey</p><h1 id="archive-heading">${attr(period?.title||'All entries')}</h1><p id="archive-intro">${attr(period?.description||'Stories, moments, and the lessons that connect them.')}</p></div><section class="container"><form class="archive-tools" role="search" onsubmit="return false"><label>Search<input id="archive-search" type="search" placeholder="Find a story…"></label><label>Journey section<select id="archive-year"><option value="">All sections</option>${visiblePeriods.map(p=>`<option value="${attr(p.id)}">${attr(p.title)}</option>`).join('')}</select></label><label>Theme<select id="archive-theme"><option value="">All themes</option>${usedThemes.map(t=>`<option value="${attr(t)}">${attr(Journey.themeName(t))}</option>`).join('')}</select></label><label>Order<select id="archive-sort"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></form><p id="archive-count" role="status"></p><div class="entry-list compact-entries" id="archive-list"></div><nav id="archive-pages" class="pagination" aria-label="Entry pages"></nav></section>`;
    const search=$('#archive-search'),sort=$('#archive-sort'),year=$('#archive-year'),theme=$('#archive-theme');
    search.value=params.get('q')||'';sort.value=params.get('sort')==='oldest'?'oldest':'newest';year.value=period?.id||'';theme.value=usedThemes.includes(params.get('theme'))?params.get('theme'):'';
    let archivePage=Math.max(1,parseInt(params.get('page'),10)||1);
    function draw(){const selected=visiblePeriods.find(p=>p.id===year.value);$('#archive-heading').textContent=selected?.title||'All entries';$('#archive-intro').textContent=selected?.description||'Stories, moments, and the lessons that connect them.';const q=search.value.trim().toLowerCase(),list=newestFirst.filter(e=>Journey.inPeriod(e,year.value)&&(!theme.value||(e.themes||[]).includes(theme.value))&&`${e.titleText||e.title} ${e.excerpt}`.toLowerCase().includes(q));if(sort.value==='oldest')list.reverse();const pageCount=Math.max(1,Math.ceil(list.length/5));archivePage=Math.min(archivePage,pageCount);$('#archive-pages').hidden=pageCount<2;$('#archive-pages').innerHTML=`<button type="button" data-page="${archivePage-1}" ${archivePage===1?'disabled':''}>← Previous</button><span>Page ${archivePage} of ${pageCount}</span><button type="button" data-page="${archivePage+1}" ${archivePage===pageCount?'disabled':''}>Next →</button>`;$('#archive-list').innerHTML=list.slice((archivePage-1)*5,archivePage*5).map(entryCard).join('')||'<div class="quiet-empty"><p>No stories match these filters yet.</p><a class="btn btn-quiet" href="entries.html?all=1">See all stories</a></div>';$('#archive-count').textContent=`${list.length} ${list.length===1?'entry':'entries'}`;const url=new URL(location.href);url.searchParams.delete('chapter');[['page',archivePage>1?String(archivePage):''],['q',search.value],['year',year.value],['theme',theme.value],['sort',sort.value==='oldest'?'oldest':'']].forEach(([key,value])=>value?url.searchParams.set(key,value):url.searchParams.delete(key));rememberQuery(url);reveal();}
    const reset=()=>{archivePage=1;draw();};search.addEventListener('input',reset);[sort,year,theme].forEach(el=>el.addEventListener('change',reset));$('#archive-pages').onclick=e=>{const b=e.target.closest('[data-page]');if(!b)return;archivePage=Number(b.dataset.page);draw();$('#archive-list').scrollIntoView({block:'start'});$('#archive-pages button:not(:disabled)')?.focus({preventScroll:true});};draw();
  },

  chapters() {
    $('#main').innerHTML=`<header class="container narrow page-head"><p class="eyebrow">Our three years of service</p><h1>The Journey</h1><p>Begin with the calling, revisit a year, or explore the latest stories.</p></header><section class="container"><div class="year-grid">${visiblePeriods.map(periodCard).join('')}</div><p class="center"><a class="btn btn-quiet" href="entries.html">Browse all entries ↗</a></p></section>`;
  },

  chapter() {
    const c = chapterById(params.get("id"));
    if (!c) { $("#main").innerHTML = notFound("chapter"); return; }
    document.title = `${c.titleText ?? c.title} | ${J.site.title}`;
    const list = J.entries.filter(e => e.chapter === c.id).sort(byDate);
    $("#main").innerHTML = `<div class="container narrow page-head"><p class="meta"><a href="chapters.html">All chapters</a></p>
      <h1>${c.title}</h1><p>${c.intro}</p></div>
      <div class="container"><div class="entry-list compact-entries" id="section-list"></div><nav id="section-pages" class="pagination" aria-label="Section entry pages"></nav></div>`;
    let currentPage=1;const drawSection=()=>{const total=Math.max(1,Math.ceil(list.length/5));$("#section-list").innerHTML=list.slice((currentPage-1)*5,currentPage*5).map(entryCard).join("")||"<p>No entries in this section yet.</p>";$("#section-pages").hidden=total<2;$("#section-pages").innerHTML=`<button type="button" data-page="${currentPage-1}" ${currentPage===1?'disabled':''}>← Previous</button><span>Page ${currentPage} of ${total}</span><button type="button" data-page="${currentPage+1}" ${currentPage===total?'disabled':''}>Next →</button>`;};$("#section-pages").onclick=e=>{const b=e.target.closest("[data-page]");if(b){currentPage=Number(b.dataset.page);drawSection();$("#section-list").scrollIntoView({block:"start"});}};drawSection();
  },

  entry() {
    const e = J.entries.find(x => x.id === params.get("id"));
    if (!e) { $("#main").innerHTML = notFound("entry"); return; }
    document.title = `${e.titleText ?? e.title} | ${J.site.title}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',String(e.excerpt||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').slice(0,200)||'A story from Along the Way.');
    $('#main').innerHTML=window.JournalReader.article(e,{journal:J,journey:Journey,ordered:orderedEntries});
  },

  about() {
    if(window.JournalFamilyAlbum){$('#main').innerHTML=window.JournalFamilyAlbum.markup(config);window.JournalFamilyAlbum.bind();document.title='About Us | Along the Way';return;}
    document.title='About Us | Along the Way';
    const photo=config.aboutPhoto||config.welcomePhoto;
    $('#main').innerHTML=`<header class="container narrow page-head"><p class="eyebrow">Hello, friends</p><h1>About Us</h1><p>${attr(config.aboutHeading||'A journey of faith, service, and becoming.')}</p></header><section class="container about-us ${photo?'with-photo':''}">${photo?img({src:photo,alt:config.aboutPhotoAlt||config.welcomePhotoAlt||'Our mission journey'},'about-portrait',true):''}<div class="prose"><h2>${attr(config.aboutNames||'Welcome to our little corner of the field.')}</h2>${(config.aboutParagraphs||['We are serving as mission leaders in San Diego, California, with The Church of Jesus Christ of Latter-day Saints.','Along the Way is where we share the moments, photographs, and lessons we want to remember from these years of service. Thank you for being part of the journey.']).map(text=>`<p>${attr(text)}</p>`).join('')}<p class="about-location">San Diego, California · Mission service</p><p><a class="btn" href="chapters.html">Explore the journey ↗</a></p></div></section><section class="container narrow about-note"></section>`;
  },

  gallery() {
    const photos = allPhotos();
    let filter = visiblePeriods.some(p=>p.id===params.get("year")) ? params.get("year") : "all", shown = [];
    const dlg = $("#viewer"); let idx = 0, opener = null;
    $("#main").innerHTML = `<div class="container narrow page-head"><h1>Our Photographs</h1><p>The people, places, and everyday moments along the way.</p></div>
      <div class="container"><div class="gallery-toolbar"><label for="gallery-chapter"><span>Browse the journey</span><select id="gallery-chapter"></select></label><p id="gallery-count" role="status"></p></div>
      <div class="photo-grid photo-grid-large" id="grid"></div></div>`;
    const filters = $("#gallery-chapter");
    filters.innerHTML = [{ id: "all", title: "All photos" }, ...visiblePeriods].map(c => `<option value="${attr(c.id)}"${c.id===filter?" selected":""}>${attr(c.title)}</option>`).join("");
    function draw() {
      shown = photos.filter(p => filter === "all" || Journey.inPeriod(p.entry,filter));
      $("#grid").innerHTML = shown.map((p, i) => `<button class="thumb" data-i="${i}" aria-label="Open photo: ${attr(p.entry.titleText||p.entry.title)}">${img(p)}</button>`).join("") || "<p>Photographs will appear here as they are added to published entries.</p>";
      $("#gallery-count").textContent=`${shown.length} ${shown.length===1?'photograph':'photographs'}`;
    }
    function show(i) {
      if (!shown.length) return;
      idx = (i + shown.length) % shown.length; const p = shown[idx];
      const viewerImage=$('#v-img');if(viewerImage.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)viewerImage.animate([{opacity:.3,transform:'translateX(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
      $("#v-count").textContent = `Photo ${idx+1} of ${shown.length}`; $("#v-img").src = p.src; $("#v-img").alt = p.alt;
      $("#v-cap").textContent = p.captionText ?? p.caption ?? "";
      $("#v-entry").textContent = p.entry.titleText ?? p.entry.title; $("#v-link").textContent="Read the story behind this photo →"; $("#v-sample").textContent = ""; $("#v-link").href = entryUrl(p.entry);
    }
    filters.addEventListener("change", () => { filter=filters.value; const url=new URL(location.href); if(filter==='all')url.searchParams.delete('year');else url.searchParams.set('year',filter);url.searchParams.delete('photo');rememberQuery(url);draw();reveal(); });
    $("#grid").addEventListener("click", e => { const b = e.target.closest(".thumb"); if (!b) return; opener = b; show(+b.dataset.i); dlg.showModal(); });
    $("#v-prev").onclick = () => show(idx - 1); $("#v-next").onclick = () => show(idx + 1); $("#v-close").onclick = () => dlg.close();
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });   // click backdrop to close
    dlg.addEventListener("close", () => opener && opener.focus());                // Escape closes natively
    dlg.addEventListener("keydown", e => { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
    let touchStart = null;
    $("#v-img").addEventListener("touchstart", e => { touchStart = e.touches.length === 1 ? {x:e.touches[0].clientX,y:e.touches[0].clientY} : null; }, {passive:true});
    $("#v-img").addEventListener("touchend", e => {
      if (!touchStart || !e.changedTouches.length) return;
      const dx=e.changedTouches[0].clientX-touchStart.x, dy=e.changedTouches[0].clientY-touchStart.y;
      if (Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.5) show(idx+(dx<0?1:-1));
      touchStart=null;
    }, {passive:true});
    $("#v-img").addEventListener("touchcancel", () => {touchStart=null;}, {passive:true});
    draw();
    const wanted = shown.findIndex(p => p.id === params.get("photo"));            // deep link from home preview
    if (wanted >= 0) { show(wanted); dlg.showModal(); }
  }
};

/* ---------- scroll reveals (IntersectionObserver; content stays visible if anything fails) ---------- */
function reveal() {
  // Home stays readable immediately, including its opening and asynchronous stories.

  try {
    const sel = "#journal-content .journal-story, #journal-content .home-family-preview, #journal-content .journal-photo-strip>a, main > section:not(.journal-opening), .chapter-band .chapter-card, main .page-head, .entry-card, .chapter-card, .entry-head, .cover, .pn-wrap, .prose > *, .snap, .story-mini, .journey > li, .photo-grid .thumb, .map-wrap";
    const els = [...document.querySelectorAll(sel)].filter(el => !el.classList.contains("in") && !el.classList.contains("reveal"));
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("in"); if (en.target.id === "map") en.target.classList.add("drawn"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    els.forEach(el => {
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty("--d", (el.closest(".stagger") || el.matches(".entry-card,.chapter-card,.thumb")) ? Math.min(i, 5) * 70 + "ms" : "0ms");
      el.classList.add("reveal"); io.observe(el);
    });
    setTimeout(() => document.querySelectorAll(".reveal:not(.in)").forEach(el => el.classList.add("in")), 4000); // safety net
    setTimeout(() => $("#map")?.classList.add("drawn"), 4500);
  } catch (err) { document.querySelectorAll(".reveal").forEach(el => el.classList.add("in")); }
}
buildChrome();
if(window.JournalBackend?.configured&&!['about','story'].includes(document.body.dataset.page)){
  const page=document.body.dataset.page;
  fetching=true;
  if(['home','story','chapters','about'].includes(page)){
    const entries=J.entries,photos=J.photos;J.entries=[];J.photos={};newestFirst=[];orderedEntries=[];pages[page]();J.entries=entries;J.photos=photos;
    // Keep the complete introduction; populate lower sections after the request.
  }else{
    const titles={story:'About Us',chapters:'The Journey',entries:'The Journey',gallery:'Our Photographs',about:'About Us',chapter:'The Journey',entry:'Along the Way'};
    $('#main').innerHTML=`<header class="container narrow page-head"><h1>${titles[page]||'Along the Way'}</h1></header>`;
  }
  $('#main').setAttribute('aria-busy','true');
  try{await window.JournalBackend.publishedJournal();}
  catch(_){$('#main').insertAdjacentHTML('beforeend','<p class="container connection-note" role="status">The stories could not be retrieved. Please check your connection. <button class="text-button" type="button" onclick="location.reload()">Try again</button></p>');$('#main').setAttribute('aria-busy','false');return;}
  fetching=false;$('#main').setAttribute('aria-busy','false');
}
visiblePeriods=Journey.visiblePeriods();
chapters=[...J.chapters].sort((a,b)=>a.order-b.order);
orderedEntries=[...J.entries].sort(byDate);newestFirst=[...J.entries].sort((a,b)=>byDate(b,a));
pages[document.body.dataset.page]();
// Restore after asynchronous loading has rebuilt the list on a Back navigation.
if(browsePage){
  window.addEventListener('pagehide',()=>{try{sessionStorage.setItem('along-the-way-scroll:'+location.href,String(window.scrollY));}catch(_){}});
  try{if(window.performance?.getEntriesByType('navigation')[0]?.type==='back_forward'){
    const y=Number(sessionStorage.getItem('along-the-way-scroll:'+location.href)||0);
    requestAnimationFrame(()=>window.scrollTo(0,y));
  }}catch(_){}
}

reveal();

function initReadingProgress() {
  const article = $("article.entry");
  if (document.body.dataset.page !== "entry" || !article) return;
  const track = document.createElement("div");
  track.className = "reading-progress"; track.setAttribute("aria-hidden", "true");
  track.innerHTML = '<span></span>'; document.body.append(track);
  const bar=track.querySelector("span"); let pending=false;
  const update=()=>{
    const top=article.getBoundingClientRect().top+window.scrollY;
    const distance=Math.max(1,article.offsetHeight-window.innerHeight);
    bar.style.transform=`scaleX(${Math.min(1,Math.max(0,(window.scrollY-top)/distance))})`;
    pending=false;
  };
  const queue=()=>{if(!pending){pending=true;requestAnimationFrame(update);}};
  window.addEventListener("scroll",queue,{passive:true}); window.addEventListener("resize",queue);
  document.querySelectorAll(".entry img").forEach(im=>im.addEventListener("load",queue,{once:true}));
  document.fonts?.ready.then(queue); update();
}
initReadingProgress();

})();
