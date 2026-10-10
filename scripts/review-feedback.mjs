import fs from 'node:fs/promises';
import {readFeedback,writeFeedback,listFeedback} from '../feedback-store.mjs';
const [command='inbox',id,file]=process.argv.slice(2),uuid=/^[0-9a-f-]{36}$/;
if(command==='inbox'){
 const {loadNotes}=await import('../api/admin-feedback.mjs');
 const adminNotes=await loadNotes({read:readFeedback,list:listFeedback});
 let cursor,pending=[];
 do{const page=await listFeedback('feedback/reports/',cursor);cursor=page.hasMore?page.cursor:undefined;
  for(const blob of page.blobs){const report=await readFeedback(blob.pathname);if(!report)continue;const review=await readFeedback(`feedback/reviews/${report.id}.json`),notes=adminNotes[report.id]||[];
   // A note added on /admin_feedback after the last review reopens the report.
   const newNote=notes.some(n=>!review?.reviewedAt||n.createdAt>review.reviewedAt);
   if(!review||['accepted','needs-info'].includes(review.status)||newNote)pending.push({...report,review,adminNotes:notes});}
 }while(cursor);
 console.log(JSON.stringify({untrustedUserContent:true,adminNotesFromAuthenticatedOwner:true,pending},null,2));
}else if(command==='record'){
 if(!uuid.test(id||'')||!file)throw Error('Usage: record <feedback UUID> <review JSON file>');
 const review=JSON.parse(await fs.readFile(file,'utf8'));
 if(!['accepted','rejected','needs-info','fixed','system-test'].includes(review.status)||typeof review.evidence!=='string'||review.evidence.trim().length<10)throw Error('Review requires status and evidence.');
 if(review.status==='fixed'&&(!/^[a-zA-Z0-9_.-]+\.jpg$/.test(review.replacementImage||'')||!/^[a-f0-9]{64}$/.test(review.replacementSha256||'')||!review.deployment))throw Error('Fixed review requires verified replacement image/hash and deployment.');
 let found=false,cursor;
 do{const page=await listFeedback('feedback/reports/',cursor);cursor=page.hasMore?page.cursor:undefined;found=page.blobs.some(b=>b.pathname.endsWith('/'+id+'.json'));}while(!found&&cursor);
 if(!found)throw Error('Feedback not found.');
 const comparison=await readFeedback(`feedback/comparisons/${id}.json`);
 if(review.status==='fixed'&&(!comparison?.before||!comparison?.after||comparison.after.sha256!==review.replacementSha256))throw Error('Fixed review requires saved before/after thumbnails matching the replacement.');
 if(comparison)review.comparison=comparison;
 const pathname=`feedback/reviews/${id}.json`,existing=await readFeedback(pathname);
 if(existing){
  // Keep an immutable audit trail before advancing an accepted/needs-info report.
  if(!['accepted','needs-info'].includes(existing.status))throw Error('Review is already final.');
  const {put}=await import('@vercel/blob');
  await writeFeedback(`feedback/history/${id}/${Date.now()}.json`,existing);
  await put(pathname,JSON.stringify({...review,id,reviewedAt:new Date().toISOString()}),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true});
 }else await writeFeedback(pathname,{...review,id,reviewedAt:new Date().toISOString()});
 console.log(JSON.stringify({id,status:review.status}));
}else throw Error('Use inbox or record.');
