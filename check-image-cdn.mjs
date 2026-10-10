import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
const stored=new Map(),pending=[];let reads=0;
const worker=vm.runInNewContext((await fs.readFile('image-cdn/cloudflare/worker.js','utf8')).replace('export default','const worker=')+';worker',{Request,Response,Headers,URL,caches:{default:{match:async req=>stored.get(req.url)?.clone(),put:async(req,res)=>stored.set(req.url,res)}}});

const object={size:3,httpEtag:'"version-1"',body:new Uint8Array([255,216,255]),writeHttpMetadata(h){h.set('Content-Type','image/jpeg');}};
const env={IMAGES:{get:async key=>{reads++;return key==='assets/scene-v1.jpg'?object:null;},head:async key=>key==='assets/scene-v1.jpg'?object:null}};
const context={waitUntil:p=>pending.push(p)};const url='https://cdn.example/assets/scene-v1.jpg';
const request=async(path=url,options)=>worker.fetch(new Request(path,options),env,context);
let res=await request();assert.equal(res.status,200);assert.equal(res.headers.get('Access-Control-Allow-Origin'),'*');assert.match(res.headers.get('Cache-Control'),/s-maxage=604800/);assert.deepEqual([...new Uint8Array(await res.arrayBuffer())],[255,216,255]);await Promise.all(pending);
res=await request();assert.equal(res.status,200);assert.equal(reads,1);
assert.equal((await request(url,{headers:{'If-None-Match':'"version-1"'}})).status,304);
res=await request(url,{method:'HEAD'});assert.equal((await res.arrayBuffer()).byteLength,0);assert.equal(res.headers.get('Content-Length'),'3');
assert.equal((await request(url,{method:'PUT',body:'bad'})).status,405);assert.equal((await request('https://cdn.example/private.txt')).status,404);assert.equal((await request('https://cdn.example/assets/missing.jpg')).status,404);assert.equal((await request(url,{method:'OPTIONS'})).status,204);
console.log('Image CDN verified: R2 JPEG, cache reuse, CORS, ETag/304, HEAD, missing assets and read-only methods.');
