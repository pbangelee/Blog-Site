/* One renderer for the published entry and the private reader preview. */
window.JournalReader=(()=>{
const NAV = [["index.html","Home","home"],["about.html","About Us","about"],["chapters.html","The Journey","chapters"],["gallery.html","Photos","gallery"]];
const entryUrl=e=>e?`entry.html?id=${encodeURIComponent(e.id)}`:'entries.html';
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
const IMAGE_SIZES = {"images/hero-ocean.jpg": [1800, 1100], "images/chapter-mtc.jpg": [1200, 800], "images/mtc-class.jpg": [800, 1100], "images/chapter-mission.jpg": [1200, 800], "images/market.jpg": [1200, 800], "images/mtc-garden.jpg": [1200, 800], "images/author-placeholder.jpg": [700, 700], "images/mtc-gate.jpg": [1200, 800], "images/market-hills.jpg": [800, 1100], "images/envelope.jpg": [1200, 800], "images/mtc-walk.jpg": [1200, 800], "images/bus-ride.jpg": [1200, 800], "images/arrival.jpg": [1200, 800], "images/packing.jpg": [1200, 800], "images/chapter-before.jpg": [1200, 800]};
const attr = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));
const img = (p, cls = "", eager = false) => {
  const dims = IMAGE_SIZES[p.src];
  const responsive = dims ? ` width="${dims[0]}" height="${dims[1]}" srcset="${p.src.replace(/\.jpg$/, '-480.webp')} 480w${dims[0] >= 960 ? `, ${p.src.replace(/\.jpg$/, '-960.webp')} 960w` : ''}" sizes="(max-width: 760px) 100vw, 600px"` : '';
  return `<img class="${cls}" src="${attr(p.src)}" alt="${attr(p.alt)}"${responsive} loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
};
const figure = (p, cls = "", full = "") => !p||p.sample ? "" : `<figure class="${cls}">${`<button type="button" class="story-photo-open" data-story-photo="${attr(full||p.src)}" data-photo-alt="${attr(p.alt)}" aria-label="Enlarge photo: ${attr(p.alt||'Story photo')}">${img(p, "", cls.includes("cover"))}<span class="photo-enlarge-hint" aria-hidden="true">View photo ↗</span></button>`}${p.caption ? `<figcaption>${p.caption}</figcaption>` : ""}</figure>`;

function chrome(page='entry'){
const current=['chapter','entry','entries'].includes(page)?'chapters':page;
return {header:`
    <div class="topline"><div class="container">Little moments & lessons along the way <span>SAN DIEGO, CA · A MISSION JOURNAL</span></div></div>
    <div class="container header-inner">
      <a class="brand" href="index.html"><img class="brand-logo" src="images/brand/logo-horizontal.svg" alt="Along the Way"></a>
      <button class="menu-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <nav id="site-nav" class="site-nav" aria-label="Main">${NAV.map(([h,t,k])=>`<a href="${h}"${k===current?' aria-current="page"':""}>${t}</a>`).join("")}</nav>
    </div>`,footer:`<div class="container footer-top"><a class="brand" href="index.html"><img class="brand-logo" src="images/brand/logo-stacked.svg" alt="Along the Way"></a><nav aria-label="Footer">${NAV.map(([h,t])=>`<a href="${h}">${t}</a>`).join("")}</nav><span class="hand">our little corner of the field.</span></div><div class="container footer-bottom"><p>A journey of faith, service, and becoming.</p><p class="sample-note">A personal journal · <a href="about.html">About us</a></p></div>`};
}
// A cropped cover keeps its crop on the page, but the enlarged view shows the whole original photograph.
function coverFull(J,e){
  const c=J.photos[e.cover];if(!c||!c.coverOriginal)return '';
  const original=Object.values(J.photos).find(p=>p.path===c.coverOriginal);
  return original?.src||'';
}
// ---- Sharing ----
const SHARE_ICON='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4"/><path d="m8 7.5 4-4 4 4"/><path d="M6 11H5.5A1.5 1.5 0 0 0 4 12.5v6A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H18"/></svg>';
const SHARE_ITEMS=[['copy','Copy link','M9 15 15 9M10.5 6.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 17.5l-1 1a3.5 3.5 0 0 1-5-5l1-1'],['email','Email','M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6'],['text','Text message','M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],['facebook','Facebook','M14 8.5h2V5.5h-2.4C11.6 5.5 10.5 6.8 10.5 8.8V10.5H8.5v3h2V20h3v-6.5h2.2l.4-3h-2.6V9.2c0-.5.2-.7.5-.7z'],['print','Print','M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z']];
const shareButton=e=>`<div class="entry-share" data-share data-share-id="${attr(e.id)}" data-share-title="${attr(e.titleText||e.title)}">
  <button type="button" class="share-toggle" aria-haspopup="true" aria-expanded="false">${SHARE_ICON}<span>Share this story</span></button>
  <div class="share-menu" role="menu" aria-label="Share this story" hidden>${SHARE_ITEMS.map(([k,t,d])=>`<button type="button" role="menuitem" data-share-action="${k}"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg><span>${t}</span></button>`).join('')}</div>
</div>`;
function article(e,{journal:J,journey:Journey,ordered:orderedEntries=[],share=true}){
    const i = orderedEntries.findIndex(item=>item.id===e.id);
    const prev = orderedEntries[i - 1], next = orderedEntries[i + 1];
    const firstMedia = e.body.find(b=>b.type==="photo"||b.type==="group");
    const body = e.body.filter(b=>!(b===firstMedia && b.type==="photo" && (b.id===e.cover || (J.photos[e.cover]?.coverOriginal && J.photos[b.id]?.path===J.photos[e.cover].coverOriginal)) && J.photos[e.cover] && !J.photos[e.cover].sample)).map(b =>
      b.type === "p" ? `<p>${b.text}</p>` :
      b.type === "photo" ? figure(J.photos[b.id], b.layout === "center" ? "photo-centered" : "wide") :
      b.type === "quote" ? `<blockquote class="journal-quote"><p>${b.text}</p>${b.attribution ? `<cite>${b.attribution}</cite>` : ""}</blockquote>` :
      `<div class="photo-group">${b.ids.map(id => figure(J.photos[id])).join("")}</div>`).join("");
    const nav = (en, label) => en ? `<a href="${entryUrl(en)}" class="pn pn-${label}"><span>${label === "prev" ? "← Revisit the previous entry" : "Turn the page →"}</span>${J.photos[en.cover]&&!J.photos[en.cover].sample?img(J.photos[en.cover],"pn-photo"):""}<strong>${en.title}</strong></a>`
                                  : `<span class="pn pn-${label} pn-end"><span>${label === "prev" ? "Previous" : "Next"}</span>${label === "prev" ? "This is the first entry" : "This is the latest entry"}</span>`;
    return `<article class="container entry editorial-entry">
      ${figure(J.photos[e.cover], "cover story-cover", coverFull(J,e))}
      <header class="entry-head"><p class="reading-label">From the journal <span aria-hidden="true">/</span> ${Math.max(1,Math.ceil(e.body.filter(b=>b.type==="p").map(b=>b.text).join(" ").split(/\s+/).length/200))} MIN READ</p><p class="meta"><a href="entries.html?year=${encodeURIComponent(Journey.forEntry(e)?.id||'')}">${attr(Journey.forEntry(e)?.title||'The Journey')}</a> <span aria-hidden="true">&middot;</span> <time datetime="${e.date}">${fmtDate(e.date)}</time></p><h1>${e.title}</h1>${share?shareButton(e):""}</header>
      ${e.byline?`<p class="entry-byline">By ${attr(e.byline)}</p>`:""}${(e.themes||[]).length?`<div class="entry-themes">${e.themes.map(t=>`<a style="${Journey.themeStyle(t)}" href="entries.html?theme=${encodeURIComponent(t)}">${attr(Journey.themeName(t))}</a>`).join("")}</div>`:""}
      <div class="prose">${body}</div>
      <nav class="pn-wrap" aria-label="Entry navigation">${nav(prev, "prev")}${nav(next, "next")}</nav>
      <p class="center"><a class="read-more" href="entries.html?year=${encodeURIComponent(Journey.forEntry(e)?.id||'')}">Back to ${attr(Journey.forEntry(e)?.title||'the journey')}</a></p></article>`;
}
function documentMarkup(e,options,base){
 const shared=chrome(),escape=attr;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${escape(base)}"><link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,400&family=Nunito+Sans:wght@400;600&family=Nothing+You+Could+Do&family=La+Belle+Aurore&display=swap" rel="stylesheet"><link rel="stylesheet" href="css/styles.css"><link rel="stylesheet" href="css/interactions.css"><link rel="stylesheet" href="css/photo-hero.css"><link rel="stylesheet" href="css/scroll-details.css"><link rel="stylesheet" href="css/brand.css"><link rel="stylesheet" href="css/nav-mobile.css"><link rel="stylesheet" href="css/story-layout.css"><style>.site-header .brand-logo{width:160px!important;max-width:100%!important;height:auto!important;max-height:60px!important;object-fit:contain}.site-footer .brand-logo{width:170px!important;max-width:100%!important;height:auto!important;max-height:100px!important;object-fit:contain}@media(max-width:760px){.site-header .brand-logo{width:120px!important;max-height:40px!important}.site-footer .brand-logo{width:140px!important;max-height:80px!important}.header-inner .brand{flex:0 0 120px!important;max-width:120px!important}.header-inner{gap:14px!important}.site-nav:not(.open){display:none!important}}html{scroll-behavior:auto}body{margin:0}a{pointer-events:none}.preview-photo-fallback{padding:35px;background:#f1eee5;text-align:center;color:#6c6c60}.preview-photo-fallback[hidden]{display:none}</style></head><body data-page="entry"><header class="site-header" id="site-header">${shared.header}</header><main id="main">${article(e,{...options,share:false})}</main><footer class="site-footer" id="site-footer">${shared.footer}</footer></body></html>`;
}
// One keyboard-accessible viewer for the public entry; the iframe preview stays private and inert.
let photoDialog, photoTrigger;
document.addEventListener('click', event=>{
 const trigger=event.target.closest('[data-story-photo]');
 if(!trigger)return;
 if(!photoDialog){
  photoDialog=document.createElement('dialog');photoDialog.className='story-photo-dialog';
  photoDialog.setAttribute('aria-label','Enlarged story photo');
  photoDialog.innerHTML='<button type="button" class="photo-viewer-close" aria-label="Close enlarged photo">Close ×</button><img alt=""><p></p>';
  document.body.append(photoDialog);
  photoDialog.querySelector('button').onclick=()=>photoDialog.close();
  photoDialog.addEventListener('click',e=>{if(e.target===photoDialog)photoDialog.close();});
  photoDialog.addEventListener('close',()=>{document.body.classList.remove('photo-viewer-open');photoTrigger?.focus({preventScroll:true});});
 }
 photoTrigger=trigger;
 photoDialog.querySelector('img').src=trigger.dataset.storyPhoto;
 photoDialog.querySelector('img').alt=trigger.dataset.photoAlt||'Story photo';
 photoDialog.querySelector('p').textContent=trigger.closest('figure')?.querySelector('figcaption')?.textContent||'';
 photoDialog.showModal();document.body.classList.add('photo-viewer-open');
});

// ---- Share menu behaviour ----
// Entries that have a generated share page (share/index.json) are shared through that page so that
// Messages, Facebook and email show the cover photo, title and a short note. Others share the plain entry link.
let sharePages=null;
const loadSharePages=()=>{if(sharePages)return;sharePages=new Set();fetch('share/index.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{if(j)(j.ids||j).forEach(id=>sharePages.add(id));}).catch(()=>{});};
const shareLink=id=>{
  const dir=new URL('.',location.href).href;
  return sharePages&&sharePages.has(id)?`${dir}share/${encodeURIComponent(id)}.html`:`${dir}entry.html?id=${encodeURIComponent(id)}`;
};
const shareMessage=title=>`Thought you\u2019d enjoy this story from Along the Way: \u201c${title}\u201d`;
let shareNote,shareNoteTimer;
function showShareNote(text){
  if(!shareNote){shareNote=document.createElement('p');shareNote.className='share-note';shareNote.setAttribute('role','status');document.body.append(shareNote);}
  shareNote.textContent=text;shareNote.classList.add('is-visible');clearTimeout(shareNoteTimer);shareNoteTimer=setTimeout(()=>shareNote.classList.remove('is-visible'),2600);
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){}
  const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.append(field);field.select();
  let ok=false;try{ok=document.execCommand('copy');}catch(e){}field.remove();return ok;
}
function closeShareMenus(except){document.querySelectorAll('[data-share]').forEach(box=>{if(box===except)return;const m=box.querySelector('.share-menu');if(m&&!m.hidden){m.hidden=true;box.querySelector('.share-toggle').setAttribute('aria-expanded','false');}});}
new MutationObserver(()=>{if(!sharePages&&document.querySelector('[data-share]'))loadSharePages();}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',async event=>{
  const box=event.target.closest('[data-share]');
  if(!box){closeShareMenus();return;}
  const id=box.dataset.shareId,title=box.dataset.shareTitle,menu=box.querySelector('.share-menu'),toggle=box.querySelector('.share-toggle');
  if(event.target.closest('.share-toggle')){
    // On phones and tablets the device's own share sheet comes first; it already lists the family's apps.
    if(navigator.share&&matchMedia('(pointer:coarse)').matches){
      try{await navigator.share({title:`${title} | Along the Way`,text:shareMessage(title),url:shareLink(id)});return;}
      catch(e){if(e&&e.name==='AbortError')return;}
    }
    const open=menu.hidden;closeShareMenus(box);menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));
    if(open)menu.querySelector('button')?.focus();
    return;
  }
  const action=event.target.closest('[data-share-action]')?.dataset.shareAction;if(!action)return;
  const url=shareLink(id),message=shareMessage(title);
  menu.hidden=true;toggle.setAttribute('aria-expanded','false');
  if(action==='copy')showShareNote(await copyText(url)?'Link copied \u2661':'Could not copy. Please copy the address from your browser.');
  if(action==='email')location.href=`mailto:?subject=${encodeURIComponent(title+' | Along the Way')}&body=${encodeURIComponent(message+'\n\n'+url)}`;
  if(action==='text')location.href=`sms:?&body=${encodeURIComponent(message+' '+url)}`;
  if(action==='facebook')window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,'_blank','noopener,noreferrer,width=640,height=560');
  if(action==='print')window.print();
  if(action!=='print')toggle.focus({preventScroll:true});
});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const box=document.querySelector('[data-share] .share-menu:not([hidden])')?.closest('[data-share]');
  if(box){closeShareMenus();box.querySelector('.share-toggle').focus();}
});
return {chrome,article,documentMarkup,img};
})();
