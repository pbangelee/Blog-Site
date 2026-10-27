/* Homepage play: the polaroid shuffle and the "Life between the lines" scroll strip.
   Event delegation, so it keeps working when main.js re-renders the page. */
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Polaroid stack ---------- */
  const setOrder=(stack,order)=>{                      // order: array of polaroids, front first
    order.forEach((el,i)=>{
      el.dataset.pos=i;
      const label=el.dataset.label||'';
      const base=(el.getAttribute('aria-label')||'').replace(/\.\s*(Open this group in the family album|Bring to the front)\.?$/,'');
      el.setAttribute('aria-label',base+'. '+(i===0?'Open this group in the family album.':'Bring to the front.'));
    });
    const status=stack.parentElement.querySelector('[data-stack-status]');
    if(status)status.textContent=(order[0].dataset.label||'')+' is now on top.';
  };
  const items=stack=>[...stack.querySelectorAll('.polaroid')].sort((a,b)=>a.dataset.pos-b.dataset.pos);

  document.addEventListener('click',e=>{
    const card=e.target.closest('.polaroid');
    if(card){
      if(card.dataset.pos==='0')return;               // front card: follow the link to the album
      e.preventDefault();
      const stack=card.closest('.polaroid-stack');
      setOrder(stack,[card,...items(stack).filter(x=>x!==card)]);
      return;
    }
    const shuffle=e.target.closest('[data-shuffle]');
    if(shuffle){
      const stack=shuffle.closest('.home-family-stack').querySelector('.polaroid-stack');
      const o=items(stack);                            // front goes to the back
      setOrder(stack,[...o.slice(1),o[0]]);
    }
  });

  /* ---------- Life between the lines ---------- */
  const refresh=strip=>{
    const track=strip.querySelector('[data-track]');if(!track)return;
    const max=track.scrollWidth-track.clientWidth;
    const scrollable=max>8;
    strip.dataset.scrollable=scrollable;
    const x=track.scrollLeft;
    track.style.setProperty('--fl',x>6?'44px':'0px');
    track.style.setProperty('--fr',x<max-6&&scrollable?'44px':'0px');
    const bar=strip.querySelector('[data-progress]');
    if(bar){const visible=track.clientWidth/track.scrollWidth;bar.style.width=Math.max(12,Math.min(100,visible*100))+'%';bar.style.translate=(max>0?(x/max)*((1/visible)-1)*100:0)+'%';}
    const [prev,next]=strip.querySelectorAll('.life-arrow');
    if(prev)prev.disabled=x<=6; if(next)next.disabled=x>=max-6;
  };
  const refreshAll=()=>document.querySelectorAll('[data-strip]').forEach(refresh);

  document.addEventListener('scroll',e=>{
    const t=e.target;if(t&&t.matches&&t.matches('[data-track]'))refresh(t.closest('[data-strip]'));
  },true);
  window.addEventListener('resize',refreshAll);
  window.addEventListener('load',refreshAll);

  document.addEventListener('click',e=>{
    const arrow=e.target.closest('.life-arrow');if(!arrow)return;
    const track=arrow.closest('[data-strip]').querySelector('[data-track]');
    const card=track.querySelector('.life-card');const step=(card?card.getBoundingClientRect().width+22:240)*2;
    track.scrollBy({left:Number(arrow.dataset.dir)*step,behavior:reduced.matches?'auto':'smooth'});
  });

  // Drag to scroll with a mouse (touch and trackpads already scroll natively)
  let drag=null;
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='mouse'||e.button!==0)return;
    const track=e.target.closest('[data-track]');if(!track)return;
    drag={track,x:e.clientX,left:track.scrollLeft,moved:false};
  });
  window.addEventListener('pointermove',e=>{
    if(!drag)return;const dx=e.clientX-drag.x;
    if(!drag.moved&&Math.abs(dx)>5){drag.moved=true;drag.track.classList.add('is-dragging');}
    if(drag.moved)drag.track.scrollLeft=drag.left-dx;
  });
  const endDrag=()=>{if(!drag)return;const t=drag.track,moved=drag.moved;drag=null;t.classList.remove('is-dragging');
    if(moved){const stop=ev=>{ev.preventDefault();ev.stopPropagation();};t.addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>t.removeEventListener('click',stop,true),0);}};
  window.addEventListener('pointerup',endDrag);window.addEventListener('pointercancel',endDrag);

  // main.js renders the sections after load and again when stories arrive
  const main=document.querySelector('main');
  if(main&&'MutationObserver' in window)new MutationObserver(()=>requestAnimationFrame(refreshAll)).observe(main,{childList:true,subtree:true});
  requestAnimationFrame(refreshAll);
})();

// Count each visible theme once; reduced-motion readers see the final total immediately.
(()=>{
 const seen=new WeakSet(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function animate(el){const target=Number(el.dataset.count);if(reduced.matches||target<2){el.textContent=target;return;}const start=performance.now();el.textContent='0';function tick(now){if(!el.isConnected)return;const p=Math.min(1,(now-start)/650);el.textContent=String(Math.round(target*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}
 const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){observer.unobserve(e.target);animate(e.target);}}),{threshold:.5}):null;
 function scan(){document.querySelectorAll('[data-count]').forEach(el=>{if(seen.has(el))return;seen.add(el);if(observer)observer.observe(el);else animate(el);});}
 new MutationObserver(scan).observe(document.querySelector('main'),{childList:true,subtree:true});scan();
})();
