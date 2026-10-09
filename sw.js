const VERSION='vible-v1',SHELL=VERSION+'-shell',IMAGES=VERSION+'-images';
const FILES=['./','./index.html','./style.css','./app.js','./annotations.js','./install.js','./manifest.webmanifest','./data/john.json','./data/acts.json','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('vible-')&&![SHELL,IMAGES].includes(k))await caches.delete(k);await self.clients.claim();})()));
let imageQueue=Promise.resolve();
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.includes('/assets/')){e.respondWith((async()=>{const c=await caches.open(IMAGES),cached=await c.match(e.request);if(cached)return cached;const response=await fetch(e.request);if(response.ok){const copy=response.clone();imageQueue=imageQueue.then(async()=>{await c.put(e.request,copy);const keys=await c.keys();for(const key of keys.slice(0,Math.max(0,keys.length-60)))await c.delete(key);});e.waitUntil(imageQueue);}return response;})());return;}
 if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope))));return;}
 const allowed=FILES.some(f=>new URL(f,self.registration.scope).pathname===url.pathname);if(allowed)e.respondWith((async()=>{const c=await caches.open(SHELL);try{const r=await fetch(e.request);if(r.ok)await c.put(e.request,r.clone());return r;}catch{return await c.match(e.request);}})());
});
