import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import {createFeedbackHandler,feedbackRecord} from './api/feedback.mjs';
import {feedbackCopy} from './feedback.js';
const body=()=>({book:'psalms',chapter:66,verse:18,lang:'ko',message:'손의 모양을 확인해 주세요.',requestId:randomUUID()});
const report=feedbackRecord({...body(),image:'evil.jpg',reference:'fake'});
assert.equal(report.reference,'시편 66:18');assert.notEqual(report.image,'evil.jpg');assert.match(report.imageSha256,/^[a-f0-9]{64}$/);
assert(report.readerURL.includes('read=1'));assert.equal(report.status,'pending');
for(const language of ['ko','en','ja','zh']){assert(feedbackCopy[language].error);assert.equal(feedbackRecord({...body(),lang:language}).lang,language);}
for(const invalid of [{message:'  '},{message:'x'.repeat(1201)},{book:'no-book'},{chapter:999},{lang:'fr'},{requestId:'not-a-uuid'}])assert.throws(()=>feedbackRecord({...body(),...invalid}));
let failed=false;const records=new Map(),storage={read:async key=>records.get(key)||null,write:async(key,value)=>{if(failed)throw Error('storage unavailable');records.set(key,value);},list:async prefix=>({blobs:[...records.keys()].filter(key=>key.startsWith(prefix)).map(pathname=>({pathname}))})};
const server=http.createServer(createFeedbackHandler(storage,()=> 'test-secret'));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const post=(payload,options={})=>fetch(origin,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...options.headers},body:JSON.stringify(payload)});
try{
 assert.equal((await fetch(origin)).status,405);
 assert.equal((await post(body(),{headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await post(body(),{headers:{'Content-Type':'text/plain'}})).status,415);
 assert.equal((await post({...body(),message:'x'.repeat(9000)})).status,413);
 assert.equal((await post({...body(),verse:999})).status,400);
 const b=body(),first=await post(b);assert.equal(first.status,201);assert.equal((await first.json()).id,b.requestId);
 assert.equal((await post(b)).status,200);assert.equal(records.size,1,'retry does not create a duplicate');
 assert.equal((await post({...b,message:'different'})).status,409);
 failed=true;assert.equal((await post(body())).status,503);failed=false;
 for(let i=1;i<20;i++)assert.equal((await post(body())).status,201);
 assert.equal((await post(body())).status,429,'rate limiting persists in storage');
 assert.equal(records.size,20);
 for(const record of records.values()){assert(!('ip' in record));assert(!('imageData' in record));}
}finally{await new Promise(resolve=>server.close(resolve));}
const html=await fs.readFile(new URL('index.html',import.meta.url),'utf8'),build=await fs.readFile(new URL('build.mjs',import.meta.url),'utf8'),sw=await fs.readFile(new URL('sw.js',import.meta.url),'utf8');
assert(html.indexOf('id="feedback-scene"')>html.indexOf('id="share-scene"'));assert(html.includes('maxlength="1200"'));assert(!html.includes('type="file"'));assert(build.includes("'feedback.js'"));assert(sw.includes("'./feedback.js'"));
console.log('Feedback: canonical passage/image provenance, four languages, private receipt, idempotent retries, size/type/origin validation, storage failure and persisted abuse limits passed.');
