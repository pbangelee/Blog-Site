/* Sticky chrome and progressive enhancement. Content stays visible without motion. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const desktop=matchMedia('(min-width: 761px)');
 let queued=false,observer;
 const seen=new WeakSet();
 function frame(){
  queued=false;
  const header=document.querySelector('#site-header');
  if(header){
   const hero=document.querySelector('.photo-led-opening');
   const height=header.getBoundingClientRect().height;
   const rect=hero?.getBoundingClientRect();
   // Reach full tan when the photo's bottom reaches the bottom of the fixed bar.
   const distance=rect?Math.max(1,rect.height-height):1;
   const progress=rect?Math.min(1,Math.max(0,-rect.top/distance)):1;
   header.classList.toggle('is-scrolled',progress>=1);
   header.style.setProperty('--hdr-p',progress.toFixed(4));
   header.style.setProperty('--hdr-t',Math.min(1,Math.max(0,(progress-.25)/.4)).toFixed(4));
   document.documentElement.style.setProperty('--journal-header-height',height+'px');
  }
  const copy=document.querySelector('.photo-led-copy'),hero=document.querySelector('.photo-led-opening');
  if(copy&&hero){const travel=desktop.matches&&!reduced.matches?Math.min(25,Math.max(0,-hero.getBoundingClientRect().top)*.065):0;copy.style.setProperty('--hero-drift',-travel+'px');}
 }
 function queue(){if(!queued){queued=true;requestAnimationFrame(frame);}}
 function enhance(){
  queue();
  document.querySelectorAll('.journal-journey-list').forEach(list=>{
   if(seen.has(list))return;seen.add(list);
   if(reduced.matches||!('IntersectionObserver' in window)){list.classList.add('path-visible');return;}
   list.classList.add('path-animated');
   const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){list.classList.add('path-visible');io.disconnect();}});},{threshold:.12});
   io.observe(list);
  });
 }
 function init(){
  enhance();const main=document.querySelector('main');
  if(main&&'MutationObserver' in window){observer=new MutationObserver(enhance);observer.observe(main,{childList:true,subtree:true});}
  window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);
  window.addEventListener('pageshow',queue);
  reduced.addEventListener?.('change',()=>{document.querySelectorAll('.journal-journey-list').forEach(list=>list.classList.add('path-visible'));queue();});
  desktop.addEventListener?.('change',queue);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
