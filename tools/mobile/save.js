// ---------- saved run: the game in progress is kept in browser storage and offered as "Pokračovat" ----------
// a saved run only loads into the same build it was saved from (another build may shape the game state differently)
const RUNV=typeof UD_BUILD!=='undefined'?UD_BUILD:1;
const runOk=x=>x&&!x.dummy&&!x.tut&&x.over!=='dead'&&x.screen!=='final'&&!(x.mode==='single'&&x.over==='win');
function runSave(){
  if(!S||S.dummy||S.tut||TUT.on)return;
  try{if(runOk(S))localStorage.setItem('ud_run',JSON.stringify({v:RUNV,t:Date.now(),S:Object.assign({},S,{history:[]}),CARDS}));else localStorage.removeItem('ud_run');}catch(e){}
}
function runLoad(){try{const o=JSON.parse(localStorage.getItem('ud_run')||'null');if(o&&o.v===RUNV&&o.S&&Array.isArray(o.CARDS)&&runOk(o.S))return o;}catch(e){}return null;}
function runClear(){try{localStorage.removeItem('ud_run');}catch(e){}}
function resumeState(){if(runOk(S)&&!TUT.on)return S;const o=runLoad();return o?o.S:null;}
function runResume(){
  if(!(runOk(S)&&!TUT.on)){const o=runLoad();if(!o)return;tutEnd();CARDS=o.CARDS;S=o.S;S.history=S.history||[];}
  busy=false;menuOpen=false;viewDeck=false;viewAdd=false;
  document.querySelectorAll('body>.card').forEach(e=>e.remove());$('deck').classList.remove('lift');
  render([]);
}
addEventListener('pagehide',runSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)runSave();});
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
// backup: everything stored (diamonds, upgrades, stats, run in progress) as one text code to copy and paste back
const BAKK=['ud_meta','ud_stats','ud_run','ud_vmus','ud_vsfx'];
function bakCode(){runSave();const o={};BAKK.forEach(k=>{try{const v=localStorage.getItem(k);if(v!==null)o[k]=v;}catch(e){}});return 'UD1:'+btoa(unescape(encodeURIComponent(JSON.stringify(o))));}
function bakOpen(){$('bakOut').value=bakCode();$('bakIn').value='';$('bakMsg').textContent='';$('bak').hidden=false;}
$('bakClose').onclick=()=>{$('bak').hidden=true;};
$('bakCopy').onclick=()=>{const t=$('bakOut');t.focus();t.select();t.setSelectionRange(0,t.value.length);const ok=()=>{$('bakCopy').textContent='Zkopírováno';setTimeout(()=>$('bakCopy').textContent='Kopírovat kód',1500);};try{navigator.clipboard.writeText(t.value).then(ok,()=>{document.execCommand('copy');ok();});}catch(e){document.execCommand('copy');ok();}};
$('bakLoad').onclick=()=>{
  const raw=$('bakIn').value.trim();let o=null;
  try{if(!raw.startsWith('UD1:'))throw 0;o=JSON.parse(decodeURIComponent(escape(atob(raw.slice(4)))));if(!o||typeof o!=='object')throw 0;}catch(e){$('bakMsg').textContent='Tenhle kód nejde přečíst. Zkopíruj ho celý, včetně začátku UD1:';return;}
  devConfirm('Současný postup na tomhle zařízení se přepíše postupem ze zálohy.',()=>{
    try{BAKK.forEach(k=>localStorage.removeItem(k));Object.keys(o).forEach(k=>{if(BAKK.includes(k))localStorage.setItem(k,o[k]);});}catch(e){}
    location.reload();
  },'Obnovit zálohu?','Obnovit');
};
