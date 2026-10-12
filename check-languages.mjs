import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {initialLanguage,passageURL,applyTranslation} from './languages.js';
import {shareHTML} from './api/share.mjs';
assert.equal(initialLanguage({locales:['fr-FR','ja-JP']}),'ja');
assert.equal(initialLanguage({url:'zh-TW',saved:'en',locales:['ko-KR']}),'zh');
assert.equal(initialLanguage({saved:'en',locales:['ko-KR']}),'en');
assert.equal(initialLanguage({locales:['de-DE']}),'ko');
assert.equal(passageURL('john',3,16,3,18,'ja'),'/share/john/3/16/3/18?lang=ja');
const base={book:'Test',chapters:1,scenes:[{id:1,chapter:1,first:1,last:2,image:'test.jpg',verses:[{verse:1,text:'Original 1'},{verse:2,text:'Original 2'}]}]};
const fixture=lang=>({language:lang,book:`Test ${lang}`,translation:'TEST ONLY',attribution:'Test attribution',source:'https://example.com',licenseSource:'https://example.com/license',permissions:{display:true,shareCards:true},chapters:[{chapter:1,verses:[{verse:1,text:`TEST ${lang} 1`},{verse:2,text:`TEST ${lang} 2`}]}]});
const incomplete=fixture('en');incomplete.chapters[0].verses.pop();assert.throws(()=>applyTranslation(base,incomplete,'en'),/Missing translation verse/);
const denied=fixture('ja');denied.permissions.shareCards=false;assert.throws(()=>applyTranslation(base,denied,'ja'),/permissions/);
assert.throws(()=>applyTranslation(base,fixture('ja'),'en'),/language mismatch/);
const root=await fs.mkdtemp(path.join(os.tmpdir(),'vible-language-tests-'));
try{
 await fs.mkdir(path.join(root,'data'),{recursive:true});await fs.writeFile(path.join(root,'data/john.json'),JSON.stringify(base));
 for(const name of ['asset-hosting.json','languages.js','bible-books.js','epistles-catalog.js','pentateuch-catalog.js','epistles-books.json','pentateuch-books.json','psalms-books.json','proverbs-books.json','songofsongs-books.json','1chronicles-books.json','2chronicles-books.json','ezra-books.json','nehemiah-books.json','esther-books.json','job-books.json','ecclesiastes-books.json','daniel-books.json','jonah-books.json','jeremiah-books.json','lamentations-books.json','historical-books.json','psalms-catalog.js','proverbs-catalog.js','songofsongs-catalog.js','1chronicles-catalog.js','2chronicles-catalog.js','ezra-catalog.js','nehemiah-catalog.js','esther-catalog.js','job-catalog.js','ecclesiastes-catalog.js','daniel-catalog.js','jonah-catalog.js','jeremiah-catalog.js','lamentations-catalog.js','historical-catalog.js','share-data.mjs','release-data.mjs','partial-release.json'])await fs.copyFile(new URL(name,import.meta.url),path.join(root,name));
 await fs.writeFile(path.join(root,'package.json'),JSON.stringify({type:'module'}));
 const {selection,shareParams}=await import(pathToFileURL(path.join(root,'share-data.mjs')));
 assert.throws(()=>selection(shareParams(new URL('https://vible.now/share/john/1/1?lang=en'))),/not available/);
 for(const lang of ['ko','en','ja','zh']){
  await fs.mkdir(path.join(root,`data/translations/${lang}`),{recursive:true});await fs.writeFile(path.join(root,`data/translations/${lang}/john.json`),JSON.stringify(fixture(lang)));
  const s=selection(shareParams(new URL(`https://vible.now/share/john/1/1/1/2?lang=${lang}`))),html=shareHTML(s);
  assert.equal(s.text,`TEST ${lang} 1\nTEST ${lang} 2`);assert.equal(s.lang,lang);
  assert(html.includes(`lang="${lang}"`));assert(html.includes(`lang=${lang}`));assert(html.includes('Test attribution'));assert(!html.includes('Original 1'));
 }
 assert.throws(()=>selection(new URLSearchParams({book:'john',chapter:1,verse:1,lang:'xx'})),/Unsupported/);
}finally{await fs.rm(root,{recursive:true,force:true});}
console.log('Language precedence, exact translated verses, permission checks, unavailable translations, localized sharing and URL propagation verified.');

const actualSelection=(await import('./share-data.mjs')).selection;
const actualCatalog=JSON.parse(await fs.readFile(new URL('./data/translations/catalog.json',import.meta.url),'utf8'));
for(const lang of ['en','ja','zh'])for(const book of actualCatalog[lang].books){
 const base=JSON.parse(await fs.readFile(new URL(`./data/${book}.json`,import.meta.url)));
 const translation=JSON.parse(await fs.readFile(new URL(`./data/translations/${lang}/${book}.json`,import.meta.url)));
 const result=applyTranslation(base,translation,lang);assert.equal(result.scenes.length,base.sceneCount);
 const shared=actualSelection(new URLSearchParams({book,chapter:'1',verse:'1',lang}));
 assert.equal(shared.lang,lang);assert(shared.path.includes(`lang=${lang}`));assert(shareHTML(shared).includes(translation.attribution.replaceAll('&','&amp;')));
}
const combined=actualSelection(new URLSearchParams({book:'acts',chapter:'1',verse:'22',lang:'zh'}));
assert.equal(combined.reference,'使徒行传 1:21–22');assert.equal(combined.verses.length,1);
assert.throws(()=>actualSelection(new URLSearchParams({book:'john',chapter:'5',verse:'4',lang:'en'})));
console.log('All catalogued real translations, translation attribution, combined verse sharing and modern omissions verified.');

for(const lang of ['en','ja','zh']){
 assert.equal(actualCatalog[lang].books.length,53);
 const closing=actualSelection(new URLSearchParams({book:'leviticus',chapter:'27',verse:'34',lang}));assert.equal(closing.lang,lang);assert(closing.text.trim());
 const psalm=actualSelection(new URLSearchParams({book:'psalms',chapter:'50',verse:'15',lang}));assert.equal(psalm.lang,lang);assert(psalm.text.trim());
}
const greeting=actualSelection(new URLSearchParams({book:'3john',chapter:'1',verse:'15',lang:'en'}));assert.equal(greeting.reference,'3 John 1:14–15');assert.match(greeting.text,/Peace to you/);
const jpRange=actualSelection(new URLSearchParams({book:'numbers',chapter:'15',verse:'5',lang:'ja'}));assert.equal(jpRange.reference,'民数記 15:4–5');assert(jpRange.text.trim());
console.log('All 159 translations, OT final verses, Psalms and edition-specific verse numbering verified.');

for(const lang of ['ko','en','ja','zh']){const p=actualSelection(new URLSearchParams({book:'proverbs',chapter:'31',verse:'31',lang}));assert.equal(p.lang,lang);assert(p.text.trim());}
const proverbBridge=actualSelection(new URLSearchParams({book:'proverbs',chapter:'26',verse:'19',lang:'zh'}));assert.equal(proverbBridge.reference,'箴言 26:18–19');assert(proverbBridge.text.trim());
for(const [lang,name] of [['ko','아가'],['en','Song of Songs'],['ja','雅歌'],['zh','雅歌']]){
 const last=actualSelection(new URLSearchParams({book:'songofsongs',chapter:'8',verse:'14',lang}));assert.equal(last.lang,lang);assert.equal(last.reference,`${name} 8:14`);assert(last.text.trim());
 const range=actualSelection(new URLSearchParams({book:'songofsongs',chapter:'2',verse:'10',endChapter:'2',endVerse:'13',lang}));assert.equal(range.lang,lang);assert(range.text.trim());
 const shulammite=actualSelection(new URLSearchParams({book:'songofsongs',chapter:'6',verse:'14',lang}));assert.equal(shulammite.reference,lang==='ko'?'아가 6:14':`${name} 6:13–14`);assert(shulammite.text.trim());
 if(lang!=='ko')assert(shulammite.attribution);
}
console.log('Song of Songs: four-language final verse, shared range, KRV 6:13–14 versification and attribution verified.');

// Chronicles–Esther, Job, Ecclesiastes, Daniel, Jonah: every book in all four languages, final verse, shared range, edition bridges and attribution.
const otBatch={'1chronicles':['역대상','1 Chronicles','歴代誌上','历代志上',29,30],'2chronicles':['역대하','2 Chronicles','歴代誌下','历代志下',36,23],ezra:['에스라','Ezra','エズラ記','以斯拉记',10,44],nehemiah:['느헤미야','Nehemiah','ネヘミヤ記','尼希米记',13,31],esther:['에스더','Esther','エステル記','以斯帖记',10,3],job:['욥기','Job','ヨブ記','约伯记',42,17],ecclesiastes:['전도서','Ecclesiastes','コヘレトの言葉','传道书',12,14],daniel:['다니엘','Daniel','ダニエル書','但以理书',12,13],jonah:['요나','Jonah','ヨナ書','约拿书',4,11]};
for(const [book,[ko,en,ja,zh,chapter,verse]] of Object.entries(otBatch)){
 for(const [lang,name] of [['ko',ko],['en',en],['ja',ja],['zh',zh]]){
  if(lang!=='ko')assert(actualCatalog[lang].books.includes(book),`${lang} ${book}`);
  const last=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang}));assert.equal(last.lang,lang);assert.equal(last.reference,`${name} ${chapter}:${verse}`);assert(last.text.trim());
  const range=actualSelection(new URLSearchParams({book,chapter:'1',verse:'1',endChapter:'1',endVerse:'3',lang}));assert.equal(range.lang,lang);assert(range.text.trim());
  if(lang!=='ko')assert(last.attribution&&shareHTML(last).includes(last.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} ${book} attribution`);
 }
}
// KRV keeps every verse; the 1955 Colloquial and OpenCCB print some as combined verses, shown as ranges without filling from another text.
for(const [book,lang,chapter,verse,reference] of [['1chronicles','ja',16,13,'歴代誌上 16:12–13'],['1chronicles','zh',8,7,'历代志上 8:6–7'],['2chronicles','zh',3,12,'历代志下 3:11–13'],['ezra','zh',2,62,'以斯拉记 2:61–62'],['nehemiah','zh',7,64,'尼希米记 7:63–64'],['esther','zh',8,12,'以斯帖记 8:11–12'],['job','zh',38,40,'约伯记 38:39–40'],['ecclesiastes','zh',7,28,'传道书 7:27–28'],['daniel','zh',2,29,'但以理书 2:28–30']]){
 const bridged=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang}));assert.equal(bridged.reference,reference);assert.equal(bridged.verses.length,1);assert(bridged.text.trim());
 const korean=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang:'ko'}));assert.equal(korean.reference,`${otBatch[book][0]} ${chapter}:${verse}`);
}
// English versification boundaries match KRV in every edition (e.g. Jonah 1:17 fish, Daniel 4:1 decree, Ecclesiastes 5:1, Nehemiah 4:1, 1 Chronicles 6:1).
for(const [book,chapter,verse,pattern] of [['jonah',1,17,{en:/great fish/,ja:/魚/,zh:/大鱼/}],['daniel',4,1,{en:/Nebuchadnezzar/,ja:/ネブカデネザル/,zh:/尼布甲尼撒/}],['nehemiah',4,1,{en:/Sanballat/,ja:/サンバラテ/,zh:/参巴拉/}],['1chronicles',6,1,{en:/Levi/,ja:/レビ/,zh:/利未/}],['ecclesiastes',5,1,{en:/house of God/,ja:/神の宮/,zh:/上帝的殿/}]])for(const lang of ['en','ja','zh'])assert.match(actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang})).text,pattern[lang],`${lang} ${book} ${chapter}:${verse}`);
console.log('Chronicles–Esther, Job, Ecclesiastes, Daniel and Jonah: four-language final verses, shared ranges, edition bridges, versification boundaries and attribution verified.');

// Lamentations: five acrostic poems (22/22/66/22/22) with the same verse boundaries in all four editions; no bridges or omissions.
for(const [lang,name] of [['ko','예레미야애가'],['en','Lamentations'],['ja','哀歌'],['zh','耶利米哀歌']]){
 if(lang!=='ko')assert(actualCatalog[lang].books.includes('lamentations'),`${lang} lamentations`);
 for(const [chapter,count] of [[1,22],[2,22],[3,66],[4,22],[5,22]]){
  const last=actualSelection(new URLSearchParams({book:'lamentations',chapter:String(chapter),verse:String(count),lang}));assert.equal(last.reference,`${name} ${chapter}:${count}`);assert.equal(last.verses.length,1);assert(last.text.trim());
  assert.throws(()=>actualSelection(new URLSearchParams({book:'lamentations',chapter:String(chapter),verse:String(count+1),lang})));
 }
 const mercies=actualSelection(new URLSearchParams({book:'lamentations',chapter:'3',verse:'22',endChapter:'3',endVerse:'23',lang}));assert.equal(mercies.lang,lang);assert.equal(mercies.reference,`${name} 3:22–23`);assert.equal(mercies.verses.length,2);
 assert.match(mercies.text,{ko:/아침마다 새로우니/,en:/new every morning/,ja:/朝ごとに新しく/,zh:/每天早晨/}[lang]);
 if(lang!=='ko')assert(mercies.attribution&&shareHTML(mercies).includes(mercies.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} lamentations attribution`);
}
console.log('Lamentations: four-language chapter-final verses (22/22/66/22/22), shared range 3:22–23 and attribution verified.');

// Jeremiah: KRV 52 chapters / 1,364 verses. BSB and the 1955 Colloquial share every KRV boundary (8:22 balm, 9:1 "my head were waters");
// OpenCCB prints 11 combined verses that stay explicit without filling the second number from another text.
const jeremiahCounts=[19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34];
const jeremiahBridges=[[11,21,22],[17,2,3],[19,1,2],[27,19,20],[29,1,2],[32,9,10],[34,18,19],[36,23,24],[41,13,14],[43,5,7],[51,59,60]];
for(const [lang,name] of [['ko','예레미야'],['en','Jeremiah'],['ja','エレミヤ書'],['zh','耶利米书']]){
 if(lang!=='ko')assert(actualCatalog[lang].books.includes('jeremiah'),`${lang} jeremiah`);
 jeremiahCounts.forEach((count,index)=>{
  const chapter=index+1,last=actualSelection(new URLSearchParams({book:'jeremiah',chapter:String(chapter),verse:String(count),lang}));assert.equal(last.reference,`${name} ${chapter}:${count}`);assert.equal(last.verses.length,1);assert(last.text.trim());
  assert.throws(()=>actualSelection(new URLSearchParams({book:'jeremiah',chapter:String(chapter),verse:String(count+1),lang})));
 });
 for(const [chapter,verse,pattern] of [[8,22,{ko:/길르앗에는 유향/,en:/balm in Gilead/,ja:/ギレアデに乳香/,zh:/基列没有药物/}],[9,1,{ko:/머리는 물이 되고/,en:/my head were a spring/,ja:/頭が水となり/,zh:/头是水泉/}],[29,11,{ko:/장래에 소망/,en:/plans I have for you/,ja:/平安を与えよう/,zh:/充满希望/}]])assert.match(actualSelection(new URLSearchParams({book:'jeremiah',chapter:String(chapter),verse:String(verse),lang})).text,pattern[lang],`${lang} jeremiah ${chapter}:${verse}`);
 const covenant=actualSelection(new URLSearchParams({book:'jeremiah',chapter:'31',verse:'31',endChapter:'31',endVerse:'34',lang}));assert.equal(covenant.lang,lang);assert.equal(covenant.reference,`${name} 31:31–34`);assert.equal(covenant.verses.length,4);
 assert.match(covenant.text,{ko:/새 언약/,en:/new covenant/,ja:/新しい契約/,zh:/新约/}[lang]);
 if(lang!=='ko')assert(covenant.attribution&&shareHTML(covenant).includes(covenant.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} jeremiah attribution`);
 for(const [chapter,first,end] of jeremiahBridges){
  const bridged=actualSelection(new URLSearchParams({book:'jeremiah',chapter:String(chapter),verse:String(end),lang}));assert(bridged.text.trim());
  assert.equal(bridged.reference,lang==='zh'?`${name} ${chapter}:${first}–${end}`:`${name} ${chapter}:${end}`);
 }
}
assert.equal(actualSelection(new URLSearchParams({book:'jeremiah',chapter:'21',verse:'2',lang:'ko'})).text,'[1절과 같음]');
assert.match(actualSelection(new URLSearchParams({book:'jeremiah',chapter:'21',verse:'2',lang:'en'})).text,/Nebuchadnezzar/);
console.log('Jeremiah: four-language chapter-final verses for all 52 chapters, 8:22/9:1 boundary, shared range 31:31–34, OpenCCB combined verses and attribution verified.');
