import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const scope='https://vible.now/',handlers={},stores=new Map();let offline=false;
const key=r=>typeof r==='string'?new URL(r,scope).href:r instanceof URL?r.href:r.url;
class Cache{constructor(){this.items=new Map();}async addAll(files){for(const f of files)this.items.set(key(f),new Response(f));}async put(r,response){this.items.set(key(r),response.clone());}async match(r){return this.items.get(key(r))?.clone();}async keys(){return [...this.items.keys()].map(url=>new Request(url));}async delete(r){return this.items.delete(key(r));}}
const caches={async open(n){if(!stores.has(n))stores.set(n,new Cache());return stores.get(n);},async keys(){return [...stores.keys()];},async delete(n){return stores.delete(n);},async match(r){for(const c of stores.values()){const found=await c.match(r);if(found)return found;}}};
vm.runInNewContext(await fs.readFile(new URL('sw.js',import.meta.url),'utf8'),{self:{location:{origin:'https://vible.now'},registration:{scope},clients:{async claim(){}},addEventListener:(name,fn)=>handlers[name]=fn},caches,URL,fetch:async r=>{if(offline)throw Error('offline');return new Response(key(r));}});
async function event(name,request){const pending=[];let result;handlers[name]({request,waitUntil:p=>pending.push(p),respondWith:p=>result=p});const response=await result;await Promise.all(pending);return response;}
await event('install');await event('activate');
const shell=await caches.open('vible-v1-shell');assert(await shell.match(scope+'data/john.json'));assert(await shell.match(scope+'data/acts.json'));
for(let n=0;n<70;n++)await event('fetch',new Request(scope+`assets/test-${n}.jpg`));
assert.equal((await (await caches.open('vible-v1-images')).keys()).length,60);
offline=true;assert.equal(await (await event('fetch',{url:scope+'?book=acts&chapter=28&verse=31',method:'GET',mode:'navigate'})).text(),'./index.html');
assert.equal(await (await event('fetch',new Request(scope+'data/acts.json'))).text(),'./data/acts.json');
assert.equal(await (await event('fetch',new Request(scope+'assets/test-69.jpg'))).text(),scope+'assets/test-69.jpg');
console.log('Offline navigation, both scripture books, viewed-image fallback and 60-image cache bound verified.');
