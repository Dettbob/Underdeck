// ---------- touch support: tap / long-press shows card tips, iOS audio unlock ----------
(function(){
  const tip=document.createElement('div');tip.id='tipx';tip.hidden=true;tip.setAttribute('role','status');document.body.append(tip);
  let lp=null,swallow=false,hideT=0;
  const hide=()=>{tip.hidden=true;clearTimeout(hideT);};
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function show(el){
    const t=el.getAttribute('data-tip');if(!t)return;
    const nm=el.getAttribute('aria-label')||'';
    tip.innerHTML=(nm?`<b>${esc(nm)}</b>`:'')+esc(t)+'<small>Klepni kamkoli pro zavření</small>';
    tip.hidden=false;clearTimeout(hideT);hideT=setTimeout(hide,9000);
  }
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse')return;
    if(!tip.hidden&&!e.target.closest('#tipx'))hide();
    if(e.target.closest('#tipx')){hide();return;}
    const el=e.target.closest('[data-tip]');if(!el)return;
    lp={el,x:e.clientX,y:e.clientY,fired:false,timer:setTimeout(()=>{if(lp){lp.fired=true;swallow=true;show(lp.el);if(navigator.vibrate)try{navigator.vibrate(10);}catch(_){}}},430)};
  },true);
  document.addEventListener('pointermove',e=>{if(lp&&Math.hypot(e.clientX-lp.x,e.clientY-lp.y)>9){clearTimeout(lp.timer);lp=null;}},true);
  const end=e=>{
    if(!lp)return;const d=lp;lp=null;clearTimeout(d.timer);if(d.fired)setTimeout(()=>{swallow=false;},400);
    // a short tap on a card (or any tip that is not inside a button) shows its tip
    if(!d.fired&&e.type==='pointerup'&&!d.el.closest('button,.tile,.pk'))show(d.el);
  };
  document.addEventListener('pointerup',end,true);
  document.addEventListener('pointercancel',end,true);
  document.addEventListener('click',e=>{if(swallow){swallow=false;e.stopPropagation();e.preventDefault();}},true);
  document.addEventListener('contextmenu',e=>{if(e.target.closest('.card,.tile,.pk,[data-tip]'))e.preventDefault();});
  // iOS only unlocks Web Audio on touchend / click, not on pointerdown
  const unlock=()=>{const c=MUS.ctx;if(c&&c.state!=='running'){c.resume().catch(()=>{});try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch(_){}}};
  ['touchend','click','pointerup'].forEach(t=>document.addEventListener(t,unlock,true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)unlock();});
})();
