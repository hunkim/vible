import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile('app.js','utf8');
const helper=source.slice(source.indexOf('function loadSceneImage('),source.indexOf('function updateScene('));
const classes=()=>{const set=new Set();return {add:c=>set.add(c),remove:c=>set.delete(c),contains:c=>set.has(c)};};
let requests=0,src=null,synchronous=false;
const img={dataset:{},classList:classes(),complete:false,naturalWidth:0,get src(){return src||'';},getAttribute:()=>src,removeAttribute:()=>{src=null;},set src(value){assert.equal(typeof this.onload,'function');assert.equal(typeof this.onerror,'function');requests++;src=value;if(synchronous){this.complete=true;this.naturalWidth=100;this.onload();}}};
const status={hidden:true,textContent:'',append(button){this.button=button;}};
const load=vm.runInNewContext(helper+';loadSceneImage',{$:id=>id==='visual'?img:status,image:s=>s.image,language:'ko',document:{createElement:()=>({})},offlineImages:false});
load({image:'first.jpg'});assert.equal(status.hidden,false);assert(img.classList.contains('is-loading'),'the previous picture dims while the next one loads');img.onload();assert.equal(status.hidden,true);assert(!img.classList.contains('is-loading'));
load({image:'first.jpg'});assert.equal(requests,1,'Same scene must not restart an image download');
load({image:'next.jpg'});await img.onerror();assert.equal(status.hidden,false);assert.match(status.textContent,/못했습니다/);assert.equal(status.button.textContent,'다시 시도');status.button.onclick();assert.equal(requests,3);img.onload();assert.equal(status.hidden,true);
load({image:'pending.svg',imagePending:true});assert.equal(status.hidden,true);img.onload();assert.equal(status.hidden,true);
synchronous=true;load({image:'cached.jpg'});assert.equal(status.hidden,true,'Cached image load is handled before assigning src');

// Store apps cache the 60 most recent scene images after they display, and read them only when the network fails.
const {keepOffline,cachedImageURL}=await import('./image-cache.js');const stored=new Map();let fetched=0;
const store={open:async()=>({match:async url=>stored.get(url)?.clone(),put:async(url,response)=>{stored.set(url,response);},keys:async()=>[...stored.keys()],delete:async url=>stored.delete(url)})};
globalThis.fetch=async url=>{fetched++;if(url.includes('offline'))throw new TypeError('offline');return new Response(new Blob(['jpg'],{type:'image/jpeg'}));};
for(let i=0;i<62;i++)await keepOffline(`https://images.vible.now/assets/s${i}.jpg`,store);
assert.equal(stored.size,60);assert(!stored.has('https://images.vible.now/assets/s0.jpg'));
await keepOffline('https://images.vible.now/assets/s61.jpg',store);assert.equal(fetched,62,'already cached images are not downloaded again');
assert.match(await cachedImageURL('https://images.vible.now/assets/s61.jpg',store),/^blob:/);
assert.equal(await cachedImageURL('https://images.vible.now/assets/offline.jpg',store),null,'uncached offline images fall back to the normal error state');
await keepOffline('https://images.vible.now/assets/offline.jpg',store);assert(!stored.has('https://images.vible.now/assets/offline.jpg'));

// In the apps the network URL is shown immediately; the cache is only filled after load and used on failure.
let kept=[],nativeSrc='';const nativeStatus={hidden:true,textContent:'',append(){}};
const nativeImg={dataset:{},classList:classes(),complete:false,naturalWidth:0,getAttribute:()=>nativeSrc,removeAttribute(){},get src(){return nativeSrc;},set src(v){nativeSrc=v;}};
const nativeLoad=vm.runInNewContext(helper+';loadSceneImage',{$:id=>id==='visual'?nativeImg:nativeStatus,image:s=>s.image,language:'ko',document:{createElement:()=>({})},offlineImages:true,keepOffline:url=>kept.push(url),cachedImageURL:async url=>url==='b.jpg'?'blob:b.jpg':null});
nativeLoad({image:'a.jpg'});assert.equal(nativeSrc,'a.jpg','scene image is requested from the network at once, not after caching');nativeImg.onload();assert.deepEqual(kept,['a.jpg']);
nativeLoad({image:'b.jpg'});const failB=nativeImg.onerror;nativeLoad({image:'c.jpg'});await failB();assert.equal(nativeSrc,'c.jpg','a failed earlier scene never replaces the current image');
nativeLoad({image:'b.jpg'});await nativeImg.onerror();assert.equal(nativeSrc,'blob:b.jpg','offline: cached copy is shown');nativeImg.onload();assert.deepEqual(kept,['a.jpg'],'cached copies are not re-cached');
nativeLoad({image:'d.jpg'});await nativeImg.onerror();assert.equal(nativeStatus.hidden,false,'uncached offline image shows the error state');
console.log('Scene images verified: immediate network display, dimming while loading, failure/retry, cached load, pending scenes, duplicate request prevention and store-app offline image cache.');
