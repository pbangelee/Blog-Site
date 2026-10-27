/* Homepage hero motion: title-card arrival and gentle scroll parallax.
   Progressive enhancement. Without JS, or with reduced motion, the photo simply sits still. */
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let hero,queued=false;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const t0=performance.now();
  // A click, key press or first scroll during the intro jumps straight to the finished page.
  function skip(){
    if(!hero||hero.classList.contains('hx-quick')||performance.now()-t0>3000)return;
    hero.classList.add('hx-quick');document.documentElement.classList.add('hx-quick');
  }

  function find(){
    if(hero&&hero.isConnected)return true;
    hero=document.querySelector('.hero-motion');
    if(!hero)return false;
    // Returning visitors in the same session skip the title card.
    let seen=false;
    try{seen=sessionStorage.getItem('atw-hero-seen')==='1';sessionStorage.setItem('atw-hero-seen','1');}catch(e){}
    if(seen){hero.classList.add('hx-quick');document.documentElement.classList.add('hx-quick');}
    if(!hero.classList.contains('hx-in')){
      // two frames so the starting state is painted before the transitions begin
      requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.add('hx-in')));
    }
    return true;
  }

  function render(){
    queued=false;
    if(!find())return;
    if(reduced.matches){hero.classList.add('hx-in');return;}
    const y=Math.max(0,window.scrollY);
    if(y>6)skip();
    const h=hero.offsetHeight||1;
    if(y>h*1.2)return;                               // hero is off-screen
    const p=clamp(y/h,0,1);
    // photo trails the page; logo drifts up and fades; tagline and cue go first
    hero.style.setProperty('--hx-y',(Math.min(y,h)*.1).toFixed(1)+'px');
    hero.style.setProperty('--hx-copy',(-p*h*.1).toFixed(1)+'px');
    hero.style.setProperty('--hx-fade',clamp(1-p*1.5,0,1).toFixed(3));
    hero.style.setProperty('--hx-sub',clamp(1-p*3.5,0,1).toFixed(3));
  }
  function queue(){if(!queued){queued=true;requestAnimationFrame(render);}}

  function init(){
    ['pointerdown','keydown','wheel','touchstart'].forEach(ev=>window.addEventListener(ev,skip,{passive:true}));
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue);
    window.addEventListener('pageshow',queue);
    // main.js renders the hero after load, so watch for it
    const main=document.querySelector('main');
    if(main&&'MutationObserver' in window){
      const mo=new MutationObserver(()=>{if(find()){queue();if(hero.classList.contains('hx-in'))mo.disconnect();}});
      mo.observe(main,{childList:true,subtree:true});
    }
    queue();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
