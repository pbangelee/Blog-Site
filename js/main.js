(async () => {
  if (window.JournalBackend?.configured) {
    document.querySelector('#main').innerHTML='<p class="container notice" role="status">Opening the journal…</p>';
    try { await window.JournalBackend.publishedJournal(); }
    catch (_) {
      document.querySelector('#main').innerHTML='<section class="container notice"><h1>The journal could not load.</h1><p>Please check your connection and try again.</p><button class="btn" type="button" onclick="location.reload()">Try again</button></section>';
      return;
    }
  }
/* Along the Way: shared page logic. Each page sets <body data-page="..."> */
const J = window.JOURNAL;
const $ = (s, el = document) => el.querySelector(s);
const params = new URLSearchParams(location.search);

/* ---------- data helpers ---------- */
const chapters = [...J.chapters].sort((a, b) => a.order - b.order);
const chapterById = id => chapters.find(c => c.id === id);
const byDate = (a, b) => a.date.localeCompare(b.date);
// Reading order: chapter order, then oldest first within a chapter
const orderedEntries = chapters.flatMap(c => J.entries.filter(e => e.chapter === c.id).sort(byDate));
const newestFirst = [...J.entries].sort((a, b) => byDate(b, a));
const entryUrl = e => e ? `entry.html?id=${encodeURIComponent(e.id)}` : "chapters.html";
const chapterUrl = c => c ? `chapter.html?id=${encodeURIComponent(c.id)}` : "chapters.html";
const fmtDate = d => new Date(d + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const photoIdsOf = e => [e.cover, ...e.body.flatMap(b => b.type === "photo" ? [b.id] : b.type === "group" ? b.ids : [])];
const allPhotos = () => {
  const seen = new Set(), list = [];
  orderedEntries.forEach(e => photoIdsOf(e).forEach(id => {
    if (seen.has(id)) return; seen.add(id);
    list.push({ ...J.photos[id], id, entry: e, chapter: chapterById(e.chapter) });
  }));
  return list;
};
const notFound = (what) => `<div class="container narrow notice"><h1>We couldn't find that ${what}</h1>
  <p>It may have moved or never existed. Let's get you back on the path.</p>
  <p><a class="btn" href="chapters.html">Browse the chapters</a> <a class="btn btn-quiet" href="index.html">Go home</a></p></div>`;

/* ---------- shared header & footer ---------- */
const NAV = [["index.html", "Home", "home"], ["chapters.html", "Chapters", "chapters"], ["gallery.html", "Gallery", "gallery"], ["about.html", "About", "about"]];
function buildChrome() {
  const page = document.body.dataset.page;
  const current = page === "chapter" || page === "entry" ? "chapters" : page;
  $("#site-header").innerHTML = `
    <div class="topline"><div class="container">LETTERS, LITTLE MOMENTS & LESSONS ALONG THE WAY <span>SAN DIEGO, CA · A MISSION JOURNAL</span></div></div>
    <div class="container header-inner">
      <a class="brand" href="index.html">Along the Way<span class="brand-dot">.</span></a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Main">${NAV.map(([h,t,k])=>`<a href="${h}"${k===current?' aria-current="page"':""}>${t}</a>`).join("")}</nav>
      <a class="header-start small-link" href="${entryUrl(orderedEntries[0])}">BEGIN READING ↗</a>
    </div>`;
  $("#site-footer").innerHTML = `<div class="container footer-top"><a class="brand" href="index.html">Along the Way.</a><nav aria-label="Footer">${NAV.map(([h,t])=>`<a href="${h}">${t}</a>`).join("")}</nav><span class="hand">with love, from here.</span></div><div class="container footer-bottom"><p>${J.site.tagline}</p><p class="sample-note">${J.site.sampleNotice}</p></div>`;
  const btn = $(".menu-toggle"), nav = $("#site-nav");
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open)); nav.classList.toggle("open", !open);
    btn.textContent = open ? "Menu" : "Close";
    nav.toggleAttribute("inert", false);
  });
  const mobileNav = matchMedia("(max-width: 760px)");
  const syncMenu = () => { nav.inert = mobileNav.matches && btn.getAttribute("aria-expanded") !== "true"; };
  syncMenu(); mobileNav.addEventListener?.("change", syncMenu);
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
    <a class="entry-card-photo" href="${entryUrl(e)}" tabindex="-1" aria-hidden="true">${img(J.photos[e.cover])}</a>
    <div class="entry-card-text">
      <p class="meta"><time datetime="${e.date}">${fmtDate(e.date)}</time> <span aria-hidden="true">&middot;</span> <a href="${chapterUrl(chapterById(e.chapter))}">${chapterById(e.chapter).title}</a></p>
      <h3><a href="${entryUrl(e)}">${e.title}</a></h3>
      <p>${e.excerpt}</p>
      <a class="read-more" href="${entryUrl(e)}">Read more<span class="sr-only"> about ${e.title}</span></a>
    </div>
  </article>`;
const chapterCard = c => `
  <a class="chapter-card" href="${chapterUrl(c)}">
    ${img({ src: c.image, alt: "" })}
    <span class="chapter-card-text"><h3>${c.title}</h3><p>${c.description}</p></span>
  </a>`;
const figure = (p, cls = "") => `<figure class="${cls}">${img(p, "", cls === "cover")}${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}</figure>`;


/* ---------- illustrated San Diego map (local SVG, hand-drawn look) ---------- */
const MAP_SVG = `<svg viewBox="0 0 800 520" role="img" aria-label="Illustrated map of the San Diego coast with a dotted decorative trail">
  <defs>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
    <mask id="route-mask"><path class="route-reveal" pathLength="1" d="M110,70 C200,110 235,165 250,235 S275,335 300,370 S420,385 520,335 S650,260 720,170" fill="none" stroke="#fff" stroke-width="14"/></mask>
  </defs>
  <rect width="800" height="520" fill="#cfe1e4"/>
  <g fill="none" stroke="#a8c4cb" stroke-width="3" stroke-linecap="round"><path d="M40,330 q15,-12 30,0 t30,0"/><path d="M120,440 q15,-12 30,0 t30,0"/><path d="M60,150 q15,-12 30,0 t30,0"/><path d="M190,490 q15,-12 30,0 t30,0"/><path d="M200,20 q15,-12 30,0 t30,0"/></g>
  <g filter="url(#wobble)">
    <path d="M340,-10 C330,50 350,100 335,150 C322,190 285,205 292,240 C298,270 330,285 335,320 C338,350 318,372 300,385 C285,400 288,430 300,455 C330,462 350,440 355,415 C375,400 420,410 440,440 C450,470 440,500 430,530 L810,530 L810,-10 Z" fill="#f7f0de" stroke="#b9a98a" stroke-width="3"/>
    <path d="M355,418 C375,396 430,405 448,436 C428,458 380,452 355,418 Z" fill="#cfe1e4" stroke="#b9a98a" stroke-width="2.5"/>
    <path d="M362,452 C392,472 398,500 388,530 L414,530 C424,500 420,472 444,448 Z" fill="#f7f0de" stroke="#b9a98a" stroke-width="2.5"/>
    <g fill="#8fa383" opacity=".45"><ellipse cx="640" cy="90" rx="110" ry="46"/><ellipse cx="710" cy="190" rx="70" ry="38"/><ellipse cx="520" cy="250" rx="60" ry="28"/></g>
    <path d="M560,380 q40,-40 90,-10 t90,-30" fill="none" stroke="#7d8f72" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round"/>
    <path class="route" d="M110,70 C200,110 235,165 250,235 S275,335 300,370 S420,385 520,335 S650,260 720,170" fill="none" stroke="#566749" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 13" mask="url(#route-mask)"/>
  </g>
  <g stroke="#6a6259" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
    <g transform="translate(150,290)"><path d="M0,0 L0,-60 L38,-6 Z" fill="#fcfaf4"/><path d="M-6,0 L50,0 L36,14 L4,14 Z" fill="#c48c6e"/></g>
    <g transform="translate(272,400)"><rect x="-6" y="-40" width="12" height="40" fill="#fcfaf4"/><path d="M-9,-40 L9,-40 L0,-54 Z" fill="#c48c6e"/><path d="M-26,-30 L-10,-34 M26,-30 L10,-34" fill="none" stroke="#d9a53a"/></g>
    <g transform="translate(470,250)" fill="none"><path d="M0,0 C4,-30 2,-50 -6,-70"/><path d="M-6,-70 C-26,-82 -40,-70 -48,-58 M-6,-70 C-4,-92 14,-98 28,-88 M-6,-70 C16,-70 30,-58 32,-44" stroke="#566749" stroke-width="4"/></g>
    <g transform="translate(620,330)" fill="none"><path d="M0,0 C4,-26 2,-44 -5,-60"/><path d="M-5,-60 C-24,-70 -36,-60 -42,-50 M-5,-60 C-3,-80 12,-84 24,-76" stroke="#566749" stroke-width="4"/></g>
    <circle cx="90" cy="60" r="22" fill="#f4d58d"/><path d="M90,22 v-10 M90,98 v10 M52,60 h-10 M128,60 h10 M63,33 l-7,-7 M117,87 l7,7 M117,33 l7,-7 M63,87 l-7,7" fill="none"/>
  </g>
  <text x="440" y="190" font-family="Caveat, cursive" font-size="64" fill="#3b3631" transform="rotate(-5 440 190)">San Diego</text>
  <text x="70" y="235" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="22" fill="#6e8f9a" transform="rotate(-8 70 235)">Pacific Ocean</text>
</svg>`;

const WRITTEN_LOGO = "<svg class=\"written-logo\" viewBox=\"0 0 700 185\" aria-hidden=\"true\" focusable=\"false\"><g fill=\"none\" stroke=\"currentColor\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path pathLength=\"1\" style=\"--stroke:0;--duration:0.34s\" d=\"M18 127 C35 108 58 56 79 34 C91 20 101 28 96 48 L72 127 C82 125 94 114 101 109\"/><path pathLength=\"1\" style=\"--stroke:1;--duration:0.2s\" d=\"M33 96 Q60 87 91 88\"/><path pathLength=\"1\" style=\"--stroke:2;--duration:0.34s\" d=\"M104 113 C117 96 142 45 139 31 C134 15 113 61 111 92 C108 116 115 127 127 121 L140 109\"/><path pathLength=\"1\" style=\"--stroke:3;--duration:0.34s\" d=\"M141 108 C142 87 168 78 177 91 C187 107 163 134 149 122 C130 107 149 86 165 88 C178 91 182 105 193 102\"/><path pathLength=\"1\" style=\"--stroke:4;--duration:0.34s\" d=\"M184 123 L201 88 L192 116 C214 82 232 80 224 102 L217 119 Q219 133 239 110\"/><path pathLength=\"1\" style=\"--stroke:5;--duration:0.34s\" d=\"M273 92 C259 76 237 103 245 119 C252 136 270 108 276 91 L257 145 C245 180 218 166 242 147 L281 116\"/><path pathLength=\"1\" style=\"--stroke:6;--duration:0.2s\" d=\"M311 119 C322 100 341 54 338 41 C334 28 317 68 315 91 C305 122 314 137 338 112\"/><path pathLength=\"1\" style=\"--stroke:7;--duration:0.34s\" d=\"M306 83 Q326 80 346 80\"/><path pathLength=\"1\" style=\"--stroke:8;--duration:0.34s\" d=\"M340 121 C356 93 376 46 370 35 C362 25 347 79 345 105 C362 81 383 80 375 101 L369 119 Q374 132 391 110\"/><path pathLength=\"1\" style=\"--stroke:9;--duration:0.34s\" d=\"M393 107 C419 105 426 87 415 88 C398 86 382 119 401 124 Q415 128 432 111\"/><path pathLength=\"1\" style=\"--stroke:10;--duration:0.34s\" d=\"M473 50 C480 22 508 23 500 50 L479 122 C495 123 525 65 536 40 L516 122 C536 125 570 66 575 32\"/><path pathLength=\"1\" style=\"--stroke:11;--duration:0.34s\" d=\"M607 94 C593 77 570 102 577 118 C584 135 603 107 610 91 L599 119 Q603 132 621 110\"/><path pathLength=\"1\" style=\"--stroke:12;--duration:0.34s\" d=\"M628 91 L618 118 C622 133 643 103 649 91 L632 144 C621 178 594 169 617 148 C629 139 654 126 671 108\"/><path pathLength=\"1\" style=\"--stroke:13;--duration:0.34s\" d=\"M172 158 C275 145 438 149 538 153 C574 154 605 153 629 149\"/></g></svg>";

/* ---------- page renderers ---------- */
const pages = {
  home() {
    if (!newestFirst.length) {
      $("#main").innerHTML = `<section class="container masthead"><p class="eyebrow">A MISSION JOURNAL</p><h1 class="written-title"><span class="sr-only">${J.site.title}</span>${WRITTEN_LOGO}</h1></section><section class="container notice"><p class="hand">the story is just beginning</p><h2>The first letter is on its way.</h2><p>Come back soon for new stories from the journey.</p><a class="btn" href="about.html">A little introduction ↗</a></section>`;
      return;
    }
    const photos = allPhotos(), first = orderedEntries[0], a = J.author;
    const [feat, ...rest] = newestFirst, fc = chapterById(feat.chapter);
    const side = e => `<article class="story-mini"><a href="${entryUrl(e)}" tabindex="-1" aria-hidden="true" class="zoom">${img(J.photos[e.cover])}</a>
      <div><p class="meta">${fmtDate(e.date)} <span aria-hidden="true">&middot;</span> ${chapterById(e.chapter).title}</p>
      <h3><a href="${entryUrl(e)}">${e.title}</a></h3><p>${e.excerpt}</p></div></article>`;
    const pinList = (J.map?.markers || []).map(m => ({ ...m, e: J.entries.find(x => x.id === m.entry) })).filter(m => m.e);
    const sizes = ["s2 tall", "s2", "s2 tall", "s3", "s3"], tilt = [-1.2, 1, -.6, 1.2, -1];
    $("#main").innerHTML = `
      <section class="container masthead">
        <p class="eyebrow">A MISSION JOURNAL · SAN DIEGO, CALIFORNIA</p>
        <h1 class="written-title"><span class="sr-only">${J.site.title}</span>${WRITTEN_LOGO}</h1>
        <div class="masthead-bottom"><p>People, places, and the things learned in between.</p><span class="hand">a little closer to home</span></div>
      </section>
      <section class="container editorial-lead" aria-labelledby="latest-title">
        <div class="section-heading"><h2 id="latest-title">Letters from lately</h2><a class="small-link" href="chapters.html">ALL ENTRIES ↗</a></div>
        <div class="stories">
          <article class="feature">
            <a class="zoom feature-image" href="${entryUrl(feat)}" aria-label="Read ${feat.title}">${img(J.photos[feat.cover], "", true)}<span class="photo-label">THE LATEST LETTER</span></a>
            <p class="meta">${fc.title} <span aria-hidden="true"> / </span> ${fmtDate(feat.date)}</p>
            <h3><a href="${entryUrl(feat)}">${feat.title}</a></h3><p>${feat.excerpt}</p>
            <a class="read-more" href="${entryUrl(feat)}">Read the letter <span aria-hidden="true">↗</span></a>
          </article>
          <div class="story-side"><div class="side-heading"><span class="hand">in case you missed it</span><span aria-hidden="true">↙</span></div>${rest.slice(0,3).map(side).join("")}</div>
        </div>
      </section>
      <section class="chapter-band" aria-labelledby="chap-h"><div class="container">
        <div class="section-heading"><div><span class="eyebrow">EVERY SEASON HAS A STORY</span><h2 id="chap-h">A few chapters of life.</h2></div><a class="small-link" href="${entryUrl(first)}">START AT THE BEGINNING ↗</a></div>
        <div class="chapter-grid">${chapters.map((c,i)=>`<a class="chapter-card" href="${chapterUrl(c)}">${img({src:c.image,alt:""})}<span class="chapter-number">0${i+1}</span><span class="chapter-card-text"><span class="eyebrow">CHAPTER 0${i+1}</span><h3>${c.title}</h3><p>${c.description}</p><span class="chapter-arrow" aria-hidden="true">↗</span></span></a>`).join("")}</div>
      </div></section>
      <section class="container author-section" aria-labelledby="hello-title">
        <div class="author-photos">${img({src:J.site.heroImage,alt:J.site.heroAlt}, "author-landscape")}<figure class="author-portrait">${img({src:a.photo,alt:a.photoAlt})}<figcaption class="hand">${a.annotation}</figcaption></figure><span class="hand photo-note">collecting little moments ↗</span></div>
        <div class="author-copy"><p class="eyebrow">A NOTE FROM ME</p><h2 id="hello-title">So glad you're here.</h2><p>${a.welcome}</p><p>This journal holds the big changes and the ordinary days. A place to keep the stories, and share a little of the journey with you.</p><a class="read-more" href="about.html">Meet the person behind the letters ↗</a></div>
      </section>
      <section class="coast-band" aria-labelledby="map-h"><div class="container coast-grid">
        <div class="coast-copy"><p class="eyebrow">A LITTLE CORNER OF THE WORLD</p><h2 id="map-h">Somewhere along<br><em>the coast.</em></h2><p>A new place, familiar kindness, and so much still to discover.</p><p class="hand">greetings from San Diego</p><a class="read-more" href="${chapterUrl(chapters[chapters.length-1])}">Stories from the field ↗</a><p class="map-note">Illustrated map · sample pins link to journal entries.</p></div>
        <div class="map-wrap" id="map">${MAP_SVG}${pinList.map(m=>`<a class="pin" style="left:${m.x}%;top:${m.y}%" href="${entryUrl(m.e)}"><span class="pin-dot"></span><span class="pin-label">${m.e.title}</span></a>`).join("")}</div>
      </div></section>
      <section class="container gallery-preview" aria-labelledby="gal-h">
        <div class="section-heading"><div><p class="hand">the days, in little pieces</p><h2 id="gal-h">Through my lens</h2></div><a class="small-link" href="gallery.html">THE WHOLE GALLERY ↗</a></div>
        <div class="memory-strip">${[...photos].reverse().slice(0,4).map((p,i)=>`<a href="gallery.html?photo=${p.id}" class="memory"><span class="zoom">${img(p)}</span><span class="memory-caption"><span class="hand">${p.caption||p.entry.title}</span><span>0${i+1}</span></span></a>`).join("")}</div>
      </section>
      <section class="closing-note container"><span class="eyebrow">UNTIL THE NEXT LETTER</span><p>There is so much good<br>to find <em>along the way.</em></p><a class="btn" href="${entryUrl(first)}">Come along with me ↗</a></section>`;
  },

  chapters() {
    $("#main").innerHTML = `<div class="container narrow page-head"><h1>Chapters</h1><p>Each chapter gathers the entries from one season of the journey.</p></div>
      <div class="container chapter-grid chapter-grid-large">${chapters.map(chapterCard).join("")}</div>`;
  },

  chapter() {
    const c = chapterById(params.get("id"));
    if (!c) { $("#main").innerHTML = notFound("chapter"); return; }
    document.title = `${c.titleText ?? c.title} | ${J.site.title}`;
    const list = J.entries.filter(e => e.chapter === c.id).sort(byDate);
    $("#main").innerHTML = `<div class="container narrow page-head"><p class="meta"><a href="chapters.html">All chapters</a></p>
      <h1>${c.title}</h1><p>${c.intro}</p></div>
      <div class="container"><div class="entry-list">${list.map(entryCard).join("") || "<p>No entries in this chapter yet.</p>"}</div></div>`;
  },

  entry() {
    const e = J.entries.find(x => x.id === params.get("id"));
    if (!e) { $("#main").innerHTML = notFound("entry"); return; }
    document.title = `${e.titleText ?? e.title} | ${J.site.title}`;
    const c = chapterById(e.chapter), i = orderedEntries.indexOf(e);
    const prev = orderedEntries[i - 1], next = orderedEntries[i + 1];
    const body = e.body.map(b =>
      b.type === "p" ? `<p>${b.text}</p>` :
      b.type === "photo" ? figure(J.photos[b.id], b.layout === "center" ? "photo-centered" : "wide") :
      b.type === "quote" ? `<blockquote class="journal-quote"><p>${b.text}</p>${b.attribution ? `<cite>${b.attribution}</cite>` : ""}</blockquote>` :
      `<div class="photo-group">${b.ids.map(id => figure(J.photos[id])).join("")}</div>`).join("");
    const nav = (en, label) => en ? `<a href="${entryUrl(en)}" class="pn pn-${label}"><span>${label === "prev" ? "← Previous letter" : "Next letter →"}</span>${en.title}</a>`
                                  : `<span class="pn pn-${label} pn-end"><span>${label === "prev" ? "Previous" : "Next"}</span>${label === "prev" ? "This is the first entry" : "This is the latest entry"}</span>`;
    $("#main").innerHTML = `<article class="container entry">
      <header class="entry-head"><p class="reading-label">A LETTER FROM THE JOURNAL <span aria-hidden="true">/</span> ${Math.max(1,Math.ceil(e.body.filter(b=>b.type==="p").map(b=>b.text).join(" ").split(/\s+/).length/200))} MIN READ</p><p class="meta"><a href="${chapterUrl(c)}">${c.title}</a> <span aria-hidden="true">&middot;</span> <time datetime="${e.date}">${fmtDate(e.date)}</time></p><h1>${e.title}</h1></header>
      ${figure(J.photos[e.cover], "cover")}
      <div class="prose">${body}</div>
      <nav class="pn-wrap" aria-label="Entry navigation">${nav(prev, "prev")}${nav(next, "next")}</nav>
      <p class="center"><a class="read-more" href="${chapterUrl(c)}">Back to ${c.title}</a></p></article>`;
  },

  about() {
    const a = J.author;
    $("#main").innerHTML = `<div class="container narrow page-head"><h1>About</h1></div>
      <section class="container narrow welcome"><img src="${a.photo}" alt="${a.photoAlt}">
        <div><h2>[Her name]</h2><p>[Placeholder: her introduction goes here.]</p>
        <p>[Placeholder: mission name, location, and dates.]</p></div></section>
      <section class="container narrow prose"><h2>Why "Along the Way"?</h2>
        <p>The name is about the things learned while traveling: the small moments, the people met, and the lessons that arrive when you least expect them. This journal is a place to share them with family and friends.</p>
        <p class="center"><a class="btn" href="${entryUrl(orderedEntries[0])}">Begin reading</a></p></section>`;
  },

  gallery() {
    const photos = allPhotos();
    let filter = chapters.some(c=>c.id===params.get("chapter")) ? params.get("chapter") : "all", shown = [];
    const dlg = $("#viewer"); let idx = 0, opener = null;
    $("#main").innerHTML = `<div class="container narrow page-head"><h1>Gallery</h1><p>Every photo from the journal in one place.</p></div>
      <div class="container"><div class="filters" role="group" aria-label="Filter photos by chapter"></div>
      <div class="photo-grid photo-grid-large" id="grid"></div></div>`;
    const filters = $(".filters");
    filters.innerHTML = [{ id: "all", title: "All photos" }, ...chapters].map(c => `<button data-f="${c.id}" aria-pressed="${c.id === filter}">${c.title}</button>`).join("");
    function draw() {
      shown = photos.filter(p => filter === "all" || p.chapter.id === filter);
      $("#grid").innerHTML = shown.map((p, i) => `<button class="thumb" data-i="${i}" aria-label="Open photo: ${p.entry.title}">${img(p)}</button>`).join("") || "<p>No photos in this chapter yet.</p>";
      filters.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
    }
    function show(i) {
      if (!shown.length) return;
      idx = (i + shown.length) % shown.length; const p = shown[idx];
      $("#v-img").src = p.src; $("#v-img").alt = p.alt;
      $("#v-cap").textContent = p.captionText ?? p.caption ?? "";
      $("#v-entry").textContent = p.entry.titleText ?? p.entry.title; $("#v-sample").textContent = p.sample === false ? "" : "Sample image. Replace with a real photo."; $("#v-link").href = entryUrl(p.entry);
    }
    filters.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; $("#grid").classList.add("fading"); setTimeout(() => { filter = b.dataset.f; draw(); $("#grid").classList.remove("fading"); reveal(); }, 180); });
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
  try {
    const sel = "main > section, .chapter-band .chapter-card, main .page-head, .entry-card, .chapter-card, .entry-head, .cover, .pn-wrap, .prose > *, .snap, .story-mini, .journey > li, .photo-grid .thumb, .map-wrap";
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
pages[document.body.dataset.page]();
reveal();

/* Motion is optional; the title remains fully visible if scripts or storage fail. */
function initWriting() {
  const title = $(".written-title");
  if (!title || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem("along-the-way-written-v1")) return;
    sessionStorage.setItem("along-the-way-written-v1", "yes");
    title.classList.add("is-writing");
    setTimeout(() => title.classList.remove("is-writing"), 5200);
  } catch (_) { /* Storage disabled: show the completed lettering. */ }
}
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
initWriting();
initReadingProgress();

})();
