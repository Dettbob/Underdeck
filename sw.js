// Underdeck offline cache. Bump VER when the game files change.
const VER='underdeck-v1';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  // the game page: try the network first (to pick up updates), fall back to the cached copy offline
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VER).then(c=>c.put('index.html',cp));return res;}).catch(()=>caches.match('index.html')));
    return;
  }
  // fonts and the rest: cache first, refresh in the background
  if(u.origin===location.origin||u.host==='fonts.googleapis.com'||u.host==='fonts.gstatic.com'){
    e.respondWith(caches.open(VER).then(c=>c.match(r).then(hit=>{
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res;}).catch(()=>hit);
      return hit||net;
    })));
  }
});
