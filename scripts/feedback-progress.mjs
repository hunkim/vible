import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {put,get} from '@vercel/blob';
import {readFeedback,listFeedback} from '../feedback-store.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [command='report',id,phase,filename]=process.argv.slice(2);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function reports(){let cursor,all=[];do{const page=await listFeedback('feedback/reports/',cursor);cursor=page.hasMore?page.cursor:undefined;for(const b of page.blobs){const r=await readFeedback(b.pathname);if(r)all.push(r);}}while(cursor);return all.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
if(command==='snapshot'){
 if(!/^[a-f0-9-]{36}$/.test(id||'')||!['before','after'].includes(phase)||!/^[\w.-]+\.jpg$/.test(filename||''))throw Error('snapshot UUID before|after IMAGE.jpg');
 const report=(await reports()).find(r=>r.id===id);if(!report)throw Error('Unknown report');
 const source=await fs.readFile(path.join(root,'assets',filename));const sha256=createHash('sha256').update(source).digest('hex');
 const reviewed=await readFeedback(`feedback/reviews/${id}.json`),priorComparison=await readFeedback(`feedback/comparisons/${id}.json`);
 if(phase==='before'&&sha256!==report.imageSha256&&sha256!==reviewed?.replacementSha256&&sha256!==priorComparison?.before?.sha256)throw Error('Before image must match the original or last reviewed replacement');
 const folder=path.join(root,'review','feedback',id);await fs.mkdir(folder,{recursive:true});const thumbnail=path.join(folder,`${phase}-${sha256}.jpg`);
 execFileSync('/opt/homebrew/bin/ffmpeg',['-v','error','-y','-i',path.join(root,'assets',filename),'-vf','scale=640:-2','-frames:v','1',thumbnail]);
 const key=`feedback/artifacts/${id}/${phase}-${sha256}.jpg`;
 const exists=await get(key,{access:'private'});if(!exists)await put(key,await fs.readFile(thumbnail),{access:'private',contentType:'image/jpeg',addRandomSuffix:false,allowOverwrite:false});
 const comparisonPath=`feedback/comparisons/${id}.json`;const comparison=await readFeedback(comparisonPath)||{id};
 if(comparison[phase]&&comparison[phase].sha256!==sha256)await put(`feedback/comparison-history/${id}/${Date.now()}-${phase}.json`,JSON.stringify(comparison),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});
 comparison[phase]={image:filename,sha256,thumbnail:key,savedAt:new Date().toISOString()};
 await put(comparisonPath,JSON.stringify(comparison),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true});await fs.writeFile(path.join(folder,'comparison.json'),JSON.stringify(comparison,null,2));console.log(`${report.reference}: ${phase} thumbnail saved privately`);
}else if(command==='report'){
 const {loadNotes}=await import('../api/admin-feedback.mjs');
 const adminNotes=await loadNotes({read:readFeedback,list:listFeedback});
 const rows=[];
 for(const r of await reports()){
  const review=await readFeedback(`feedback/reviews/${r.id}.json`);if(review?.status==='system-test')continue;
  const comparison=await readFeedback(`feedback/comparisons/${r.id}.json`);const pictures=[];
  for(const phase of ['before','after']){const a=comparison?.[phase];let img='';if(a){const blob=await get(a.thumbnail,{access:'private'});if(blob){const bytes=Buffer.from(await new Response(blob.stream).arrayBuffer());img=`<img src="data:image/jpeg;base64,${bytes.toString('base64')}" alt="${phase==='before'?'수정 전':'수정 후'}">`;}}pictures.push(`<figure><figcaption>${phase==='before'?'수정 전':'수정 후'}</figcaption>${img||'<div class="empty">아직 없음</div>'}</figure>`);}
  const notes=adminNotes[r.id]||[];const reopened=notes.some(n=>!review?.reviewedAt||n.createdAt>review.reviewedAt);
  const status=reopened?'pending':review?.status||'pending';const labels={pending:'검토 대기',accepted:'수정 대기',fixed:'배포 완료',rejected:'수정 불필요','needs-info':'추가 확인'};
  rows.push(`<article><header><h2>${escape(r.reference)}</h2><span class="status ${escape(status)}">${escape(labels[status]||status)}</span></header><p>${escape(r.message)}</p>${notes.map(n=>`<p class="evidence"><strong>관리자 의견</strong> · ${escape(n.text)}</p>`).join('')}<p class="evidence">${escape(review?.evidence||'원본과 구절을 대조하여 검토합니다.')}</p><div class="comparison">${pictures.join('')}</div><footer>${escape(r.createdAt)} ${review?.deployment?` · <a href="${escape(review.deployment)}" target="_blank" rel="noreferrer">배포 보기</a>`:''} · <a href="${escape(r.readerURL)}" target="_blank" rel="noreferrer">구절 열기</a></footer></article>`);
 }
 const html=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vible 그림 수정 현황</title><style>body{margin:0;background:#f3f1e8;color:#263d34;font:16px/1.6 system-ui}main{max-width:1150px;margin:40px auto;padding:0 24px}h1{margin-bottom:4px}h2{font-size:20px;margin:0}article{padding:24px;background:#fffdf7;border:1px solid #d6ddd3;border-radius:18px;margin:24px 0}header{display:flex;justify-content:space-between;gap:12px;align-items:center}.status{border-radius:20px;background:#ebe7d6;padding:4px 14px;font-size:14px}.fixed{background:#d9eddf}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}figcaption{margin-bottom:8px;font-weight:600}img{width:100%;border-radius:10px}.empty{aspect-ratio:16/9;display:grid;place-items:center;background:#eff0e9;border-radius:10px;color:#798377}.evidence,footer{font-size:14px;color:#737c73}footer{margin-top:16px}a{color:#365d49}@media(max-width:600px){.comparison{grid-template-columns:1fr}main{padding:0 12px}article{padding:18px}}</style><main><h1>Vible 그림 수정 현황</h1><p>접수 ${rows.length}건 · 갱신 ${escape(new Date().toISOString())} · 비공개 검토 기록</p>${rows.join('')}</main></html>`;
 const destination=path.join(root,'review','feedback-progress.html');await fs.writeFile(destination,html);console.log(destination);
}else throw Error('Use snapshot or report');
