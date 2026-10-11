import {createHmac} from 'node:crypto';
import fs from 'node:fs';
import {selection} from '../share-data.mjs';
import {bookNames} from '../languages.js';
import {readFeedback,writeFeedback,listFeedback} from '../feedback-store.mjs';
const hosting=JSON.parse(fs.readFileSync(new URL('../asset-hosting.json',import.meta.url),'utf8'));
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Store apps load bundled files from these local origins (Capacitor iOS/Android, Tauri macOS/Windows).
export const appOrigins=new Set(['capacitor://localhost','https://localhost','tauri://localhost','http://tauri.localhost','https://tauri.localhost']);
function fail(status){return Object.assign(Error('Invalid feedback'),{status});}
export function feedbackRecord(body,now=new Date()){
 if(!body||typeof body!=='object'||!uuid.test(body.requestId||'')||typeof body.message!=='string'||!['ko','en','ja','zh'].includes(body.lang))throw fail(400);
 const message=body.message.trim();if(!message||message.length>1200)throw fail(400);
 let s;try{s=selection(new URLSearchParams({book:body.book,chapter:String(body.chapter),verse:String(body.verse),lang:'ko'}));}catch{throw fail(400);}
 const scene=s.verses[0].scene,reference=`${bookNames[body.lang][s.book]} ${scene.chapter}:${scene.first}${scene.last===scene.first?'':`–${scene.last}`}`;
 return {schema:1,id:body.requestId.toLowerCase(),createdAt:now.toISOString(),book:s.book,chapter:scene.chapter,verse:Number(body.verse),first:scene.first,last:scene.last,lang:body.lang,reference,message,sceneId:scene.id,image:s.image,imageSha256:hosting.files[s.image]?.sha256||null,readerURL:`https://vible.now/?book=${s.book}&chapter=${scene.chapter}&verse=${body.verse}&read=1&lang=${body.lang}`,status:'pending'};
}
export function createFeedbackHandler(storage={read:readFeedback,write:writeFeedback,list:listFeedback},secret=()=>process.env.BLOB_READ_WRITE_TOKEN){
 return async(req,res)=>{
  const origin=req.headers.origin,cors=appOrigins.has(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors});res.end(JSON.stringify(data));};
  if(req.method==='OPTIONS'&&cors['Access-Control-Allow-Origin']){res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'});return res.end();}
  if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,{ok:false});}
  try{
   if(!origin||(!appOrigins.has(origin)&&(new URL(origin).host!==req.headers.host||!['http:','https:'].includes(new URL(origin).protocol))))throw fail(403);
   if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw fail(415);
   let body=req.body;
   if(body===undefined){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw fail(413);}try{body=JSON.parse(text);}catch{throw fail(400);}}
   else if(typeof body==='string'){if(Buffer.byteLength(body)>8192)throw fail(413);try{body=JSON.parse(body);}catch{throw fail(400);}}
   if(Buffer.byteLength(JSON.stringify(body))>8192)throw fail(413);
   const record=feedbackRecord(body);if(!secret())throw fail(503);
   // Anonymous abuse limits survive cold starts; raw IP addresses are never stored.
   const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
   const sender=createHmac('sha256',secret()).update(record.createdAt.slice(0,10)+':'+ip).digest('hex').slice(0,24),prefix=`feedback/reports/${record.createdAt.slice(0,10)}/${sender}/`,pathname=prefix+record.id+'.json';
   const prior=await storage.read(pathname);if(prior){if(prior.message!==record.message||prior.book!==record.book||prior.chapter!==record.chapter||prior.verse!==record.verse||prior.lang!==record.lang)throw fail(409);return reply(200,{ok:true,id:prior.id});}
   const recent=await storage.list(prefix,undefined,20);if(recent.blobs.length>=20)throw fail(429);
   try{await storage.write(pathname,record);}catch(error){const existing=await storage.read(pathname);if(!existing)throw error;if(existing.message!==record.message)throw fail(409);}
   return reply(201,{ok:true,id:record.id});
  }catch(error){if(!error.status)console.error('Feedback storage unavailable');return reply(error.status||503,{ok:false});}
 };
}
export default createFeedbackHandler();
