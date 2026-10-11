import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source=await fs.readFile('app.js','utf8');
const helper=source.slice(source.indexOf('function loadSceneImage('),source.indexOf('function updateScene('));
let requests=0,src=null,synchronous=false;
const img={complete:false,naturalWidth:0,getAttribute:()=>src,removeAttribute:()=>{src=null;},set src(value){assert.equal(typeof this.onload,'function');assert.equal(typeof this.onerror,'function');requests++;src=value;if(synchronous){this.complete=true;this.naturalWidth=100;this.onload();}}};
const status={hidden:true,textContent:'',append(button){this.button=button;}};
const load=vm.runInNewContext(helper+';loadSceneImage',{$:id=>id==='visual'?img:status,image:s=>s.image,language:'ko',document:{createElement:()=>({})},offlineImages:false});
load({image:'first.jpg'});assert.equal(status.hidden,false);img.onload();assert.equal(status.hidden,true);
load({image:'first.jpg'});assert.equal(requests,1,'Same scene must not restart an image download');
load({image:'next.jpg'});img.onerror();assert.equal(status.hidden,false);assert.match(status.textContent,/못했습니다/);assert.equal(status.button.textContent,'다시 시도');status.button.onclick();assert.equal(requests,3);img.onload();assert.equal(status.hidden,true);
load({image:'pending.svg',imagePending:true});assert.equal(status.hidden,true);img.onload();assert.equal(status.hidden,true);
synchronous=true;load({image:'cached.jpg'});assert.equal(status.hidden,true,'Cached image load is handled before assigning src');

// Store apps resolve scene images through the offline cache and keep only the 60 most recent.
const {offlineImageURL}=await import('./image-cache.js');const stored=new Map();let fetched=0;
const store={open:async()=>({match:async url=>stored.get(url)?.clone(),put:async(url,response)=>{stored.set(url,response);},keys:async()=>[...stored.keys()],delete:async url=>stored.delete(url)})};
globalThis.fetch=async url=>{fetched++;if(url.includes('offline'))throw new TypeError('offline');return new Response(new Blob(['jpg'],{type:'image/jpeg'}));};
for(let i=0;i<62;i++)assert.match(await offlineImageURL(`https://images.vible.now/assets/s${i}.jpg`,store),/^blob:/);
assert.equal(stored.size,60);assert(!stored.has('https://images.vible.now/assets/s0.jpg'));
assert.match(await offlineImageURL('https://images.vible.now/assets/s61.jpg',store),/^blob:/);assert.equal(fetched,62,'cached images load without the network');
assert.equal(await offlineImageURL('https://images.vible.now/assets/offline.jpg',store),'https://images.vible.now/assets/offline.jpg','uncached offline images fall back to the normal error state');
let pending;const nativeImg={dataset:{},getAttribute:()=>null,removeAttribute(){},set src(v){this.value=v;}};
const nativeLoad=vm.runInNewContext(helper+';loadSceneImage',{$:id=>id==='visual'?nativeImg:{hidden:true},image:s=>s.image,language:'ko',document:{createElement:()=>({})},offlineImages:true,offlineImageURL:url=>new Promise(r=>pending=()=>r('blob:'+url))});
nativeLoad({image:'a.jpg'});nativeLoad({image:'b.jpg'});const finishB=pending;finishB();await new Promise(r=>setImmediate(r));assert.equal(nativeImg.value,'blob:b.jpg','a slower earlier scene never replaces the current image');
console.log('Scene images verified: loading, failure/retry, cached load, pending scenes, duplicate request prevention and store-app offline image cache.');
