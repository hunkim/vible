import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {jesusWords} from './jesus-words-data.js';
import {scriptureParts} from './jesus-words.js';
import {shareHTML} from './api/share.mjs';
import {selection,shareParams} from './share-data.mjs';
const texts={};let checked=0;
for(const [lang,books] of Object.entries(jesusWords)){
 texts[lang]={};
 for(const [book,records] of Object.entries(books)){
  const data=JSON.parse(await fs.readFile(lang==='ko'?`data/${book}.json`:`data/translations/${lang}/${book}.json`,'utf8'));
  const rows=lang==='ko'?data.scenes:data.chapters;
  const verses=Object.fromEntries(rows.flatMap(row=>row.verses.map(v=>[`${row.chapter}:${v.verse}`,v.text])));
  texts[lang][book]=verses;
  for(const ref of Object.keys(records)){
   const text=verses[ref];assert.equal(typeof text,'string');
   assert.equal([...text].length,text.length,`${lang} ${book} ${ref} requires UTF-16 offsets`);
   const parts=scriptureParts(book,...ref.split(':').map(Number),lang,text);
   assert(parts.some(p=>p.jesus),`${lang} ${book} ${ref} has stale or invalid annotation`);
   assert.equal(parts.map(p=>p.text).join(''),text,'Exact scripture text must survive formatting');checked++;
  }
 }
}
const parts=(lang,book,ref)=>scriptureParts(book,...ref.split(':').map(Number),lang,texts[lang][book][ref]);
const marked=(lang,book,ref)=>parts(lang,book,ref).filter(p=>p.jesus).map(p=>p.text).join(' ');
assert.equal(marked('ko','john','20:15'),'여자여 어찌하여 울며 누구를 찾느냐');
assert(!marked('ko','john','7:29').includes('하신대'));
assert(!marked('ko','acts','1:5').includes('하셨느니라'));
assert.equal(marked('ko','john','1:38'),'무엇을 구하느냐');
assert.equal(marked('ko','john','21:15'),'요한의 아들 시몬아 네가 이 사람들보다 나를 더 사랑하느냐 내 어린 양을 먹이라');
assert.equal(marked('ko','john','12:28'),'아버지여 아버지의 이름을 영광스럽게 하옵소서');
assert.equal(marked('ko','acts','20:35'),'주는 것이 받는 것보다 복이 있다');
assert(!marked('ko','revelation','22:20').includes('아멘'));
for(const lang of Object.keys(texts)){
 for(const ref of ['10:13','10:15','11:7','11:9'])assert(!jesusWords[lang].acts[ref],'Unidentified heavenly voices must not be labelled as Jesus');
 assert.equal(Object.keys(jesusWords[lang].romans).length,0);
 assert(parts(lang,'john','21:15').filter(p=>!p.jesus).some(p=>p.text.trim()),'Peter’s response and narration remain ordinary text');
 const text=texts[lang].john['14:6'];
 assert.deepEqual(scriptureParts('john',14,6,lang,text+' changed'),[{text:text+' changed',jesus:false}],'Changed translations safely fall back to plain text');
 assert(!scriptureParts('john',1,1,lang,texts[lang].john['1:1']).some(p=>p.jesus));
 assert(!scriptureParts('genesis',1,3,lang,'Let there be light').some(p=>p.jesus));
 const selected=selection(shareParams(new URL(`/share/john/21/15?lang=${lang}`,'https://vible.now')));
 const html=shareHTML(selected);assert(html.includes('<strong class="jesus-words">'));
 const paragraphs=html.match(/<blockquote>([\s\S]*?)<\/blockquote>/)[1];
 const decode=s=>s.replace(/<[^>]+>/g,'').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
 assert.equal(decode(paragraphs),selected.verses.map(v=>v.text).join(''),'Shared-page formatting preserves scripture');
 assert(!shareHTML(selection(shareParams(new URL(`/share/romans/8/28?lang=${lang}`,'https://vible.now')))).includes('<strong class="jesus-words">'));
}
console.log(`Jesus’ words: ${checked} language/verse annotations preserve exact text; mixed speakers, safe fallback and localized sharing verified.`);
