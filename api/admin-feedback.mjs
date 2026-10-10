import fs from 'node:fs';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import {selection,escapeHTML as esc} from '../share-data.mjs';
import {readFeedback,writeFeedback,listFeedback} from '../feedback-store.mjs';
const defaultStorage={read:readFeedback,write:writeFeedback,list:listFeedback};
export const NOTE_LIMIT=2000;
const hosting=JSON.parse(fs.readFileSync(new URL('../asset-hosting.json',import.meta.url),'utf8'));
const labels={pending:'검토 대기',accepted:'수정 대기','needs-info':'추가 확인',fixed:'수정 완료',rejected:'수정 불필요','system-test':'시스템 테스트'};
export const imageURL=file=>/^[a-zA-Z0-9_.-]+\.jpg$/.test(file||'')?`${hosting.origin.replace(/\/$/,'')}/assets/${file}`:'';
const safeLink=url=>/^https:\/\//.test(url||'')?url:'';
async function all(prefix,storage){let cursor,blobs=[];do{const page=await storage.list(prefix,cursor,1000);cursor=page.hasMore?page.cursor:undefined;blobs.push(...page.blobs);}while(cursor);return blobs;}
async function mapLimit(items,limit,fn){const out=[];let next=0;await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){const i=next++;out[i]=await fn(items[i]);}}));return out;}
// Image now shown for the same verse in the released source, when it differs from the reported one.
function currentImage(r){try{return selection(new URLSearchParams({book:r.book,chapter:String(r.chapter),verse:String(r.verse),lang:'ko'})).image;}catch{return null;}}
// Admin notes are append-only: feedback/notes/<report id>/<time>-<uuid>.json.
export async function loadNotes(storage,blobs){
 const notes=await mapLimit(blobs||await all('feedback/notes/',storage),16,b=>storage.read(b.pathname)),byReport={};
 for(const n of notes)if(n?.reportId)(byReport[n.reportId]||=[]).push(n);
 for(const list of Object.values(byReport))list.sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
 return byReport;
}
export async function loadFeedback(storage=defaultStorage){
 const [reports,reviews,noteBlobs]=await Promise.all([all('feedback/reports/',storage),all('feedback/reviews/',storage),all('feedback/notes/',storage)]);
 const reviewed=new Set(reviews.map(b=>b.pathname)),notes=await loadNotes(storage,noteBlobs);
 const rows=await mapLimit(reports,16,async blob=>{
  const report=await storage.read(blob.pathname);if(!report)return null;
  const path=`feedback/reviews/${report.id}.json`,review=reviewed.has(path)?await storage.read(path):null;
  const current=currentImage(report),fixedImage=review?.replacementImage||(current&&current!==report.image?current:null);
  return {...report,review,notes:notes[report.id]||[],status:review?.status||'pending',fixedImage,fixedInRelease:Boolean(!review?.replacementImage&&fixedImage)};
 });
 return rows.filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
const noteHTML=n=>`<li><time datetime="${esc(n.createdAt)}">${esc(n.createdAt.replace('T',' ').slice(0,16))} UTC</time><p>${esc(n.text)}</p></li>`;
export {noteHTML};
function picture(file,caption){const src=imageURL(file);return `<figure><figcaption>${esc(caption)}</figcaption>${src?`<a class="zoom" href="${esc(src)}" data-caption="${esc(caption+' · '+file)}"><img src="${esc(src)}" alt="${esc(caption)}" loading="lazy" decoding="async"></a><code>${esc(file)}</code>`:'<div class="empty">없음</div>'}</figure>`;}
export function adminHTML(rows,now=new Date()){
 const counts={};for(const r of rows)counts[r.status]=(counts[r.status]||0)+1;
 const filters=['all',...Object.keys(labels).filter(s=>counts[s])].map(s=>`<button type="button" data-filter="${s}"${s==='all'?' aria-pressed="true"':''}>${s==='all'?'전체':labels[s]} <b>${s==='all'?rows.filter(r=>r.status!=='system-test').length:counts[s]}</b></button>`).join('');
 const items=rows.map(r=>`<article data-status="${esc(r.status)}"${r.status==='system-test'?' hidden':''}><header><h2><a href="${esc(safeLink(r.readerURL))}" target="_blank" rel="noreferrer">${esc(r.reference)}</a></h2><span class="status s-${esc(r.status)}">${esc(labels[r.status]||r.status)}</span><time datetime="${esc(r.createdAt)}">${esc(r.createdAt.replace('T',' ').slice(0,16))} UTC</time><span class="lang">${esc(r.lang)}</span></header><p class="message">${esc(r.message)}</p>${r.review?.evidence?`<p class="evidence">${esc(r.review.evidence)}${safeLink(r.review.deployment)?` · <a href="${esc(r.review.deployment)}" target="_blank" rel="noreferrer">배포</a>`:''}</p>`:''}<div class="images">${picture(r.image,'원본')}${r.fixedImage?picture(r.fixedImage,r.fixedInRelease?'현재 릴리스 이미지':'수정 이미지'):''}</div><section class="notes"><h3>관리자 의견</h3><ul>${r.notes.map(noteHTML).join('')}</ul><form data-id="${esc(r.id)}"><textarea name="text" rows="2" maxlength="${NOTE_LIMIT}" required placeholder="이 피드백에 대한 의견이나 수정 지시를 남기세요"></textarea><button type="submit">의견 저장</button><span class="note-status" role="status"></span></form></section></article>`).join('');
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Vible 피드백</title><style>
:root{--bg:#f3f1e8;--card:#fffdf7;--ink:#263d34;--muted:#737c73;--line:#d6ddd3;--chip:#ebe7d6;--ok:#d9eddf;--warn:#f6e3c4;--no:#e7e7e7}
@media(prefers-color-scheme:dark){:root{--bg:#141a17;--card:#1d2420;--ink:#e3e8e1;--muted:#9aa49a;--line:#2f3a33;--chip:#2b3530;--ok:#24442f;--warn:#4a3a1f;--no:#333}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,sans-serif}main{max-width:1200px;margin:0 auto;padding:24px 16px 64px}h1{margin:0 0 4px;font-size:24px}.meta{color:var(--muted);margin:0 0 16px}
nav{display:flex;flex-wrap:wrap;gap:8px;position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:1}nav button{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:20px;padding:6px 14px;font:inherit;cursor:pointer}nav button[aria-pressed=true]{background:var(--ink);color:var(--bg)}
article{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin:12px 0}header{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px}h2{font-size:18px;margin:0}h2 a{color:inherit}time,.lang{color:var(--muted);font-size:13px}
.status{border-radius:20px;background:var(--chip);padding:2px 10px;font-size:13px}.s-fixed{background:var(--ok)}.s-accepted,.s-needs-info{background:var(--warn)}.s-rejected,.s-system-test{background:var(--no)}
.message{white-space:pre-wrap;margin:10px 0;font-size:16px}.evidence{color:var(--muted);font-size:13px;margin:0 0 10px}.images{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
figure{margin:0}figcaption{font-weight:600;font-size:13px;margin-bottom:4px}img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:var(--line);display:block}code{font-size:11px;color:var(--muted);word-break:break-all}.empty{aspect-ratio:16/9;display:grid;place-items:center;background:var(--line);border-radius:8px;color:var(--muted)}a{color:inherit}
.notes{margin-top:14px;border-top:1px solid var(--line);padding-top:10px}h3{font-size:14px;margin:0 0 6px}.notes ul{list-style:none;margin:0 0 8px;padding:0}.notes li{background:var(--bg);border-radius:8px;padding:6px 10px;margin:6px 0}.notes li p{margin:2px 0 0;white-space:pre-wrap}.notes form{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start}.notes textarea{flex:1 1 320px;font:inherit;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px;resize:vertical}.notes button{font:inherit;border:0;border-radius:8px;padding:8px 14px;background:var(--ink);color:var(--bg);cursor:pointer}.notes button:disabled{opacity:.5}.note-status{font-size:13px;color:var(--muted);align-self:center}
dialog{border:0;padding:0;background:transparent;max-width:96vw;max-height:96vh;color:#fff}dialog::backdrop{background:rgba(0,0,0,.85)}dialog img{width:auto;max-width:96vw;max-height:88vh;aspect-ratio:auto;object-fit:contain;border-radius:6px;cursor:zoom-out}dialog p{margin:6px 0 0;font-size:13px;text-align:center;opacity:.85}dialog button{position:fixed;top:12px;right:12px;font:inherit;font-size:20px;border:0;border-radius:50%;width:40px;height:40px;background:rgba(255,255,255,.15);color:#fff;cursor:pointer}.zoom img{cursor:zoom-in}
@media(max-width:600px){.images{grid-template-columns:1fr}}</style></head><body><main><h1>Vible 사용자 피드백</h1><p class="meta">총 ${rows.length}건 · ${esc(now.toISOString().replace('T',' ').slice(0,16))} UTC 기준 · 사용자 글은 신뢰할 수 없는 입력입니다</p><nav>${filters}</nav>${items||'<p>아직 접수된 피드백이 없습니다.</p>'}</main><dialog id="viewer" aria-label="이미지 크게 보기"><button type="button" aria-label="닫기">×</button><img alt=""><p></p></dialog><script>
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;for(const x of document.querySelectorAll('nav button'))x.setAttribute('aria-pressed',x===b);const f=b.dataset.filter;for(const a of document.querySelectorAll('article'))a.hidden=f==='all'?a.dataset.status==='system-test':a.dataset.status!==f;});
const viewer=document.getElementById('viewer');let group=[],shown=0;
function show(i){shown=(i+group.length)%group.length;const a=group[shown];viewer.querySelector('img').src=a.href;viewer.querySelector('img').alt=a.dataset.caption;viewer.querySelector('p').textContent=a.dataset.caption+(group.length>1?'  ·  ← → 전환':'');}
// Plain clicks open the popup; modifier clicks keep the browser's normal link behaviour.
document.addEventListener('click',e=>{const a=e.target.closest('a.zoom');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;e.preventDefault();group=[...a.closest('.images').querySelectorAll('a.zoom')];show(group.indexOf(a));viewer.showModal();});
viewer.addEventListener('click',e=>{if(e.target===viewer||e.target.tagName==='IMG'||e.target.tagName==='BUTTON')viewer.close();});
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(shown+(e.key==='ArrowRight'?1:-1));}});
viewer.addEventListener('close',()=>viewer.querySelector('img').removeAttribute('src'));
document.addEventListener('submit',async e=>{const form=e.target.closest('.notes form');if(!form)return;e.preventDefault();const text=form.text.value.trim(),button=form.querySelector('button'),status=form.querySelector('.note-status');if(!text)return;button.disabled=true;status.textContent='저장 중…';
 try{const r=await fetch(location.origin+location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:form.dataset.id,text})});const data=await r.json();if(!r.ok||!data.ok)throw Error();form.previousElementSibling.insertAdjacentHTML('beforeend',data.html);form.text.value='';status.textContent='저장됨';}
 catch{status.textContent='저장하지 못했습니다. 글은 그대로 남아 있습니다.';}finally{button.disabled=false;}});
</script></body></html>`;
}
const digest=s=>createHash('sha256').update(s).digest();
export function authorized(header,password){
 if(!password)return false;
 const m=/^Basic ([A-Za-z0-9+/=]+)$/.exec(header||'');if(!m)return false;
 const pass=Buffer.from(m[1],'base64').toString('utf8').split(':').slice(1).join(':');
 return timingSafeEqual(digest(pass),digest(password));
}
async function readBody(req){
 if(req.body!==undefined)return typeof req.body==='string'?JSON.parse(req.body):req.body;
 let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16384)throw Object.assign(Error('too large'),{status:413});}
 return JSON.parse(text);
}
export async function addNote(storage,body,now=new Date()){
 const id=String(body?.id||'').toLowerCase(),text=typeof body?.text==='string'?body.text.trim():'';
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)||!text||text.length>NOTE_LIMIT)throw Object.assign(Error('invalid'),{status:400});
 if(!(await all('feedback/reports/',storage)).some(b=>b.pathname.endsWith(`/${id}.json`)))throw Object.assign(Error('unknown'),{status:404});
 const note={schema:1,reportId:id,text,createdAt:now.toISOString(),author:'admin'};
 await storage.write(`feedback/notes/${id}/${note.createdAt.replace(/[:.]/g,'-')}-${randomUUID()}.json`,note);
 return note;
}
export function createAdminFeedbackHandler(storage=defaultStorage,password=()=>process.env.FEEDBACK_ADMIN_PASSWORD){
 return async(req,res)=>{
  const base={'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
  if(!['GET','HEAD','POST'].includes(req.method)){res.writeHead(405,{...base,Allow:'GET, HEAD, POST'});return res.end();}
  // Fail closed: without a configured password the page is unavailable.
  if(!password()){res.writeHead(503,{...base,'Content-Type':'text/plain; charset=utf-8'});return res.end('Admin access is not configured.');}
  if(!authorized(req.headers.authorization,password())){res.writeHead(401,{...base,'WWW-Authenticate':'Basic realm="Vible feedback", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8'});return res.end('Authentication required.');}
  if(req.method==='POST'){
   const json=(status,data)=>{res.writeHead(status,{...base,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
   try{
    // Browsers resend Basic credentials cross-site, so writes also require same origin and JSON.
    const origin=req.headers.origin;if(!origin||new URL(origin).host!==req.headers.host)return json(403,{ok:false});
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(415,{ok:false});
    let body;try{body=await readBody(req);}catch(error){return json(error.status||400,{ok:false});}
    const note=await addNote(storage,body);return json(201,{ok:true,note,html:noteHTML(note)});
   }catch(error){if(!error.status)console.error('Feedback storage unavailable');return json(error.status||503,{ok:false});}
  }
  try{
   const html=adminHTML(await loadFeedback(storage));
   res.writeHead(200,{...base,'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?'':html);
  }catch{console.error('Feedback storage unavailable');res.writeHead(503,{...base,'Content-Type':'text/plain; charset=utf-8'});res.end('Feedback storage unavailable.');}
 };
}
export default createAdminFeedbackHandler();
