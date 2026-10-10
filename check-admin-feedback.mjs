import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {feedbackRecord} from './api/feedback.mjs';
import {createAdminFeedbackHandler,authorized,imageURL} from './api/admin-feedback.mjs';
const make=(over={})=>({...feedbackRecord({book:'psalms',chapter:66,verse:18,lang:'ko',message:'<script>alert(1)</script> 손 모양',requestId:randomUUID()}),...over});
const pending=make({createdAt:'2026-10-01T00:00:00.000Z'}),fixed=make({createdAt:'2026-10-03T00:00:00.000Z'}),stale=make({createdAt:'2026-10-02T00:00:00.000Z',image:'psalms-old-v0.jpg'}),test=make({createdAt:'2026-10-04T00:00:00.000Z'});
const records=new Map([[`feedback/reports/2026-10-01/a/${pending.id}.json`,pending],[`feedback/reports/2026-10-03/a/${fixed.id}.json`,fixed],[`feedback/reports/2026-10-02/a/${stale.id}.json`,stale],[`feedback/reports/2026-10-04/a/${test.id}.json`,test],
 [`feedback/reviews/${fixed.id}.json`,{status:'fixed',evidence:'손가락 수를 고쳤습니다.',replacementImage:'psalms-fixed-v2.jpg',deployment:'javascript:alert(1)'}],[`feedback/reviews/${test.id}.json`,{status:'system-test',evidence:'intake smoke test'}]]);
let reads=0;
const storage={read:async key=>{reads++;return records.get(key)||null;},list:async prefix=>({blobs:[...records.keys()].filter(k=>k.startsWith(prefix)).map(pathname=>({pathname}))})};
assert.equal(authorized('Basic '+Buffer.from('admin:secret').toString('base64'),'secret'),true);
assert.equal(authorized('Basic '+Buffer.from('admin:wrong').toString('base64'),'secret'),false);
assert.equal(authorized('Basic '+Buffer.from('admin:').toString('base64'),''),false);
assert.equal(imageURL('../x.jpg'),'');
const server=http.createServer(createAdminFeedbackHandler(storage,()=> 'secret')),closed=http.createServer(createAdminFeedbackHandler(storage,()=> ''));
await Promise.all([server,closed].map(s=>new Promise(r=>s.listen(0,'127.0.0.1',r))));
const url=s=>`http://127.0.0.1:${s.address().port}/`,auth=p=>({Authorization:'Basic '+Buffer.from('admin:'+p).toString('base64')});
try{
 assert.equal((await fetch(url(closed),{headers:auth('')})).status,503,'no password configured fails closed');
 const denied=await fetch(url(server));assert.equal(denied.status,401);assert.match(denied.headers.get('www-authenticate'),/^Basic/);
 assert.equal((await fetch(url(server),{headers:auth('nope')})).status,401);assert.equal(reads,0,'no storage reads before authentication');
 assert.equal((await fetch(url(server),{method:'POST',headers:auth('secret')})).status,405);
 const ok=await fetch(url(server),{headers:auth('secret')}),html=await ok.text();
 assert.equal(ok.status,200);assert.equal(ok.headers.get('cache-control'),'no-store');assert.match(ok.headers.get('x-robots-tag'),/noindex/);
 assert(!html.includes('<script>alert(1)'),'user text is escaped');assert(html.includes('&lt;script&gt;alert(1)'));assert(!html.includes('javascript:alert'),'unsafe deployment links are dropped');
 assert.equal(reads,6,'reviews are read only when they exist');
 const articles=html.split('<article').slice(1);assert.equal(articles.length,4);
 assert(articles[0].includes('data-status="system-test"')&&articles[0].includes(' hidden'),'system tests hidden by default');
 assert(articles[1].includes('수정 완료')&&articles[1].includes('https://images.vible.now/assets/psalms-fixed-v2.jpg')&&articles[1].includes(`/assets/${fixed.image}`),'fixed shows original and replacement');
 assert(articles[2].includes('현재 릴리스 이미지')&&articles[2].includes('psalms-old-v0.jpg')&&articles[2].includes(`/assets/${fixed.image}`),'image changed in release is shown');
 assert(articles[3].includes('검토 대기')&&!articles[3].includes('수정 이미지')&&!articles[3].includes('현재 릴리스'),'unfixed shows original only');
}finally{await Promise.all([server,closed].map(s=>new Promise(r=>s.close(r))));}
const vercel=JSON.parse(await fs.readFile(new URL('vercel.json',import.meta.url),'utf8'));
assert(vercel.rewrites.some(r=>r.source==='/admin_feedback'&&r.destination==='/api/admin-feedback'));
console.log('Admin feedback: password required (fails closed), escaped reports, original/replacement/current images, status filters and noindex/no-store passed.');
