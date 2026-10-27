/* Native cross-document transitions where available, short fallback elsewhere.
   Never intercept external links, downloads, anchors or Writing Room navigation. */
(()=>{
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const native='onpagereveal' in window;
 let leaving=false;
 function enter(){leaving=false;if(!native&&!motion.matches&&document.querySelector('main')?.animate){document.querySelector('main').animate([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});}}
 window.addEventListener('pageshow',enter);
})();
