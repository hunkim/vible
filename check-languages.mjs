import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
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
 for(const name of ['asset-hosting.json','languages.js','bible-books.js','epistles-catalog.js','pentateuch-catalog.js','epistles-books.json','pentateuch-books.json','psalms-books.json','proverbs-books.json','songofsongs-books.json','1chronicles-books.json','2chronicles-books.json','ezra-books.json','nehemiah-books.json','esther-books.json','job-books.json','ecclesiastes-books.json','daniel-books.json','jonah-books.json','jeremiah-books.json','lamentations-books.json','ezekiel-books.json','hosea-books.json','isaiah-books.json','minorprophets-books.json','historical-books.json','psalms-catalog.js','proverbs-catalog.js','songofsongs-catalog.js','1chronicles-catalog.js','2chronicles-catalog.js','ezra-catalog.js','nehemiah-catalog.js','esther-catalog.js','job-catalog.js','ecclesiastes-catalog.js','daniel-catalog.js','jonah-catalog.js','jeremiah-catalog.js','lamentations-catalog.js','ezekiel-catalog.js','hosea-catalog.js','isaiah-catalog.js','minorprophets-catalog.js','historical-catalog.js','share-data.mjs','release-data.mjs','partial-release.json'])await fs.copyFile(new URL(name,import.meta.url),path.join(root,name));
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
 assert.equal(actualCatalog[lang].books.length,66);
 const closing=actualSelection(new URLSearchParams({book:'leviticus',chapter:'27',verse:'34',lang}));assert.equal(closing.lang,lang);assert(closing.text.trim());
 const psalm=actualSelection(new URLSearchParams({book:'psalms',chapter:'50',verse:'15',lang}));assert.equal(psalm.lang,lang);assert(psalm.text.trim());
}
const greeting=actualSelection(new URLSearchParams({book:'3john',chapter:'1',verse:'15',lang:'en'}));assert.equal(greeting.reference,'3 John 1:14–15');assert.match(greeting.text,/Peace to you/);
const jpRange=actualSelection(new URLSearchParams({book:'numbers',chapter:'15',verse:'5',lang:'ja'}));assert.equal(jpRange.reference,'民数記 15:4–5');assert(jpRange.text.trim());
console.log('All 198 translations, OT final verses, Psalms and edition-specific verse numbering verified.');

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
assert.match(actualSelection(new URLSearchParams({book:'jeremiah',chapter:'21',verse:'2',lang:'ko'})).text,/느부갓네살이 우리를 치니/);
assert.match(actualSelection(new URLSearchParams({book:'jeremiah',chapter:'21',verse:'2',lang:'en'})).text,/Nebuchadnezzar/);
console.log('Jeremiah: four-language chapter-final verses for all 52 chapters, 8:22/9:1 boundary, shared range 31:31–34, OpenCCB combined verses and attribution verified.');
// 개역한글 prints these pairs as one verse; the electronic text's "[n절과 같음]" placeholder is never shown as Scripture.
for(const [book,chapter,first,name] of [['jeremiah',21,1,'예레미야'],['acts',15,25,'사도행전'],['romans',9,1,'로마서']])for(const verse of [first,first+1]){
 const shared=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse)}));
 assert.equal(shared.reference,`${name} ${chapter}:${first}–${first+1}`);assert.equal(shared.verses.length,1);assert.doesNotMatch(shared.text,/같음/);
}
console.log('Korean combined verses: Jeremiah 21:1–2, Acts 15:25–26 and Romans 9:1–2 display and share as one verse without the placeholder.');
// Ezekiel and Hosea: KRV follows the English chapter boundaries (Ezekiel 20:45–49 before 21:1; Hosea 1:10–11, 11:12 and 13:16 at chapter ends),
// as do BSB, the 1955 Colloquial and OpenCCB, so no verse is moved. OpenCCB prints Ezekiel 16:56–57 and 41:9–10 as combined verses.
const prophets={ezekiel:{names:{ko:'에스겔',en:'Ezekiel',ja:'エゼキエル書',zh:'以西结书'},counts:[28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
 boundaries:[[20,45,{ko:/여호와의 말씀이 또 내게 임하여/,en:/word of the LORD came to me/,ja:/主の言葉がまたわたしに臨んだ/,zh:/耶和华对我说/}],[20,49,{ko:/비유로 말하는 자/,en:/parables/,ja:/たとえをもって語る者/,zh:/比喻/}],[21,5,{ko:/칼을 집에서 빼어낸/,en:/sword from its sheath/,ja:/つるぎをさやから抜き放った/,zh:/拔刀出鞘/}],[36,26,{ko:/새 마음/,en:/new heart/,ja:/新しい心/,zh:/新心/}]],
 range:[37,3,37,4,{ko:/마른 뼈들아/,en:/Dry bones/,ja:/枯れた骨よ/,zh:/枯骨啊/}]},
 hosea:{names:{ko:'호세아',en:'Hosea',ja:'ホセア書',zh:'何西阿书'},counts:[11,23,5,19,15,11,16,14,17,15,12,14,16,9],
 boundaries:[[1,10,{ko:/바닷가의 모래/,en:/sand of the sea/,ja:/海の砂/,zh:/海沙/}],[2,1,{ko:/암미/,en:/My people/,ja:/アンミ/,zh:/阿米/}],[11,12,{ko:/에브라임은 거짓으로/,en:/Ephraim surrounds Me with lies/,ja:/エフライムは偽り/,zh:/以法莲用谎话/}],[12,1,{ko:/동풍/,en:/east wind/,ja:/東風/,zh:/东风/}],[13,16,{ko:/사마리아/,en:/Samaria/,ja:/サマリヤ/,zh:/撒玛利亚/}],[14,1,{ko:/돌아오라/,en:/Return, O Israel/,ja:/主に帰れ/,zh:/归向你的上帝/}]],
 range:[6,1,6,3,{ko:/힘써 여호와를 알자/,en:/press on to know the LORD/,ja:/せつに主を知ることを求めよう/,zh:/竭力认识耶和华/}]}};
for(const [book,{names,counts,boundaries,range}] of Object.entries(prophets))for(const [lang,name] of Object.entries(names)){
 if(lang!=='ko')assert(actualCatalog[lang].books.includes(book),`${lang} ${book}`);
 counts.forEach((count,index)=>{
  const chapter=index+1,last=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(count),lang}));assert.equal(last.reference,`${name} ${chapter}:${count}`);assert.equal(last.verses.length,1);assert(last.text.trim());
  assert.throws(()=>actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(count+1),lang})));
 });
 for(const [chapter,verse,pattern] of boundaries)assert.match(actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang})).text,pattern[lang],`${lang} ${book} ${chapter}:${verse}`);
 const [chapter,verse,endChapter,endVerse,pattern]=range,shared=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),endChapter:String(endChapter),endVerse:String(endVerse),lang}));
 assert.equal(shared.lang,lang);assert.equal(shared.reference,`${name} ${chapter}:${verse}–${endVerse}`);assert.equal(shared.verses.length,endVerse-verse+1);assert.match(shared.text,pattern[lang]);
 if(lang!=='ko')assert(shared.attribution&&shareHTML(shared).includes(shared.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} ${book} attribution`);
 for(const [chapter,first,end] of book==='ezekiel'?[[16,56,57],[41,9,10]]:[]){
  const bridged=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(end),lang}));assert(bridged.text.trim());assert.equal(bridged.verses.length,1);
  assert.equal(bridged.reference,lang==='zh'?`${name} ${chapter}:${first}–${end}`:`${name} ${chapter}:${end}`);
 }
}
// 개역한글 prints Ezekiel 24:4–5 as one verse (electronic text: "[4절과 같음]"); the other editions keep verse 5 separate.
for(const verse of [4,5]){const pot=actualSelection(new URLSearchParams({book:'ezekiel',chapter:'24',verse:String(verse)}));assert.equal(pot.reference,'에스겔 24:4–5');assert.equal(pot.verses.length,1);assert.match(pot.text,/가마 밑에 나무를 쌓아/);assert.doesNotMatch(pot.text,/같음/);}
for(const [lang,pattern] of [['en',/choicest of the flock/],['ja',/羊の最も良いもの/],['zh',/上好的羊/]]){const pot=actualSelection(new URLSearchParams({book:'ezekiel',chapter:'24',verse:'5',lang}));assert.equal(pot.reference,`${prophets.ezekiel.names[lang]} 24:5`);assert.match(pot.text,pattern);}
console.log('Ezekiel and Hosea: four-language chapter-final verses for all 48 and 14 chapters, Hebrew/English boundary verses, shared ranges, KRV 24:4–5, OpenCCB combined verses and attribution verified.');
// Isaiah: KRV, BSB, the 1955 Colloquial and OpenCCB all follow the English chapter boundaries (8:22 before 9:1 "no more gloom", 9:2 "great light",
// 63:19 before 64:1 "rend the heavens"), so no verse is moved. KRV prints 7:8–9, 30:1–2 and 48:1–2 as one verse; the 1955 Colloquial prints 4:3–4;
// OpenCCB prints 4:3–4, 10:1–2 and 65:6–7.
const isaiah={names:{ko:'이사야',en:'Isaiah',ja:'イザヤ書',zh:'以赛亚书'},counts:[31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
 boundaries:[[8,22,{ko:/흑암/,en:/darkness/,ja:/暗黒/,zh:/黑暗/}],[9,1,{ko:/스불론/,en:/Zebulun/,ja:/ゼブルン/,zh:/西布伦/}],[9,2,{ko:/큰 빛/,en:/great light/,ja:/大いなる光/,zh:/大光/}],[9,6,{ko:/평강의 왕/,en:/Prince of Peace/,ja:/平和の君/,zh:/和平的君/}],[63,19,{ko:/다스림을 받지 못하는/,en:/never ruled/,ja:/治められない/,zh:/治理/}],[64,1,{ko:/하늘을 가르고/,en:/rend the heavens/,ja:/天を裂いて/,zh:/裂天而降/}],[64,12,{ko:/잠잠하시고/,en:/keep silent/,ja:/黙して/,zh:/缄默/}],[66,24,{ko:/벌레가 죽지 아니하며/,en:/worm will never die/,ja:/うじは死なず/,zh:/虫不会死/}]],
 bridges:{ko:[[7,8,9],[30,1,2],[48,1,2]],en:[],ja:[[4,3,4]],zh:[[4,3,4],[10,1,2],[65,6,7]]}};
for(const [lang,name] of Object.entries(isaiah.names)){
 if(lang!=='ko')assert(actualCatalog[lang].books.includes('isaiah'),`${lang} isaiah`);
 isaiah.counts.forEach((count,index)=>{
  const chapter=index+1,last=actualSelection(new URLSearchParams({book:'isaiah',chapter:String(chapter),verse:String(count),lang}));assert.equal(last.reference,`${name} ${chapter}:${count}`);assert.equal(last.verses.length,1);assert(last.text.trim());
  assert.throws(()=>actualSelection(new URLSearchParams({book:'isaiah',chapter:String(chapter),verse:String(count+1),lang})));
 });
 for(const [chapter,verse,pattern] of isaiah.boundaries)assert.match(actualSelection(new URLSearchParams({book:'isaiah',chapter:String(chapter),verse:String(verse),lang})).text,pattern[lang],`${lang} isaiah ${chapter}:${verse}`);
 const shared=actualSelection(new URLSearchParams({book:'isaiah',chapter:'9',verse:'1',endChapter:'9',endVerse:'2',lang}));
 assert.equal(shared.lang,lang);assert.equal(shared.reference,`${name} 9:1–2`);assert.equal(shared.verses.length,2);assert.match(shared.text,isaiah.boundaries[1][2][lang]);assert.match(shared.text,isaiah.boundaries[2][2][lang]);
 if(lang!=='ko')assert(shared.attribution&&shareHTML(shared).includes(shared.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} isaiah attribution`);
 const bridged=new Set(isaiah.bridges[lang].map(([c,f])=>`${c}:${f}`));
 for(const [chapter,first,end] of Object.values(isaiah.bridges).flat())for(const verse of [first,end]){
  const picked=actualSelection(new URLSearchParams({book:'isaiah',chapter:String(chapter),verse:String(verse),lang}));assert(picked.text.trim());assert.equal(picked.verses.length,1);assert.doesNotMatch(picked.text,/절과 같음/);
  assert.equal(picked.reference,bridged.has(`${chapter}:${first}`)?`${name} ${chapter}:${first}–${end}`:`${name} ${chapter}:${verse}`,`${lang} isaiah ${chapter}:${verse}`);
 }
}
for(const [chapter,verse,pattern] of [[7,9,/만일 너희가 믿지 아니하면/],[30,2,/애굽으로 내려갔으되/],[48,2,/거룩한 성 백성이라/]]){const ko=actualSelection(new URLSearchParams({book:'isaiah',chapter:String(chapter),verse:String(verse)}));assert.match(ko.text,pattern);assert.doesNotMatch(ko.text,/같음/);}
console.log('Isaiah: four-language chapter-final verses for all 66 chapters, Hebrew/English boundary verses (8:22–9:2, 63:19–64:1), shared 9:1–2, KRV 7:8–9, 30:1–2 and 48:1–2, Japanese and OpenCCB combined verses and attribution verified.');
// Joel–Malachi: KRV, BSB, the 1955 Colloquial and OpenCCB all follow the English chapter and verse boundaries where the Hebrew numbering differs
// (Joel 2:28–32 = Hebrew 3:1–5 and 3:1–21 = 4:1–21; Micah 5:1 = 4:14; Nahum 1:15 = 2:1; Zechariah 1:18–21 = 2:1–4; Malachi 4:1–6 = 3:19–24),
// so no verse is moved. OpenCCB prints Zephaniah 2:1–2 and 2:8–9 as combined verses; no other edition combines or omits a verse in these books.
const minorProphets={
 joel:{names:{ko:'요엘',en:'Joel',ja:'ヨエル書',zh:'约珥书'},counts:[20,32,21],cross:[2,32,3,1],
  boundaries:[[2,28,{ko:/내 신을 만민에게 부어/,en:/pour out My Spirit/,ja:/わが霊をすべての肉なる者に注ぐ/,zh:/将我的灵浇灌/}],[2,32,{ko:/여호와의 이름을 부르는 자/,en:/calls on the name of the LORD/,ja:/主の名を呼ぶ者は救われる/,zh:/求告耶和华之名/}],[3,1,{ko:/사로잡힌 자를 돌아오게/,en:/restore Judah and Jerusalem/,ja:/ユダとエルサレムとの幸福/,zh:/被掳的人返乡/}],[3,21,{ko:/시온에 거함/,en:/dwells in Zion/,ja:/シオンに住まわれる/,zh:/住在锡安/}]]},
 amos:{names:{ko:'아모스',en:'Amos',ja:'アモス書',zh:'阿摩司书'},counts:[15,16,15,13,27,14,17,14,15],cross:[7,9,7,10],
  boundaries:[[5,24,{ko:/공법을 물 같이/,en:/justice roll on like a river/,ja:/公道を水のように/,zh:/公正如江河/}],[7,8,{ko:/다림줄/,en:/plumb line/,ja:/測りなわ/,zh:/准绳/}]]},
 obadiah:{names:{ko:'오바댜',en:'Obadiah',ja:'オバデヤ書',zh:'俄巴底亚书'},counts:[21],
  boundaries:[[1,21,{ko:/나라가 여호와께 속하리라/,en:/kingdom will belong to the LORD/,ja:/王国は主のものとなる/,zh:/耶和华必做王掌权/}]]},
 micah:{names:{ko:'미가',en:'Micah',ja:'ミカ書',zh:'弥迦书'},counts:[16,13,12,13,15,16,20],cross:[4,13,5,1],
  boundaries:[[4,13,{ko:/딸 시온이여 일어나서 칠지어다/,en:/Rise and thresh/,ja:/立って打ちこなせ/,zh:/起来打谷/}],[5,1,{ko:/딸 군대여/,en:/daughter of troops/,ja:/壁でとりまかれている/,zh:/调集军队/}],[5,2,{ko:/베들레헴 에브라다/,en:/Bethlehem Ephrathah/,ja:/ベツレヘム・エフラタ/,zh:/伯利恒/}],[6,8,{ko:/겸손히 네 하나님과 함께 행하는 것/,en:/walk humbly with your God/,ja:/へりくだってあなたの神と共に歩む/,zh:/谦卑地与你们的上帝同行/}]]},
 nahum:{names:{ko:'나훔',en:'Nahum',ja:'ナホム書',zh:'那鸿书'},counts:[15,13,19],cross:[1,15,2,1],
  boundaries:[[1,15,{ko:/화평을 전하는 자의 발/,en:/brings good news/,ja:/良きおとずれを伝える者の足/,zh:/传喜讯/}],[2,1,{ko:/파괴하는 자가/,en:/One who scatters/,ja:/撃ち破る者/,zh:/攻击者/}]]},
 habakkuk:{names:{ko:'하박국',en:'Habakkuk',ja:'ハバクク書',zh:'哈巴谷书'},counts:[17,20,19],cross:[2,20,3,1],
  boundaries:[[2,4,{ko:/의인은 믿음으로 말미암아 살리라/,en:/righteous will live by faith/,ja:/義人はその信仰によって生きる/,zh:/义人必靠信心而活/}]]},
 zephaniah:{names:{ko:'스바냐',en:'Zephaniah',ja:'ゼファニヤ書',zh:'西番雅书'},counts:[18,15,20],cross:[2,15,3,1],bridges:{zh:[[2,1,2],[2,8,9]]},
  boundaries:[[3,17,{ko:/기쁨을 이기지 못하여/,en:/rejoice over you/,ja:/喜び楽しみ/,zh:/欢然歌唱/}]]},
 haggai:{names:{ko:'학개',en:'Haggai',ja:'ハガイ書',zh:'哈该书'},counts:[15,23],cross:[1,15,2,1],
  boundaries:[[2,23,{ko:/스룹바벨/,en:/Zerubbabel/,ja:/ゼルバベル/,zh:/所罗巴伯/}]]},
 zechariah:{names:{ko:'스가랴',en:'Zechariah',ja:'ゼカリヤ書',zh:'撒迦利亚书'},counts:[21,13,10,14,11,15,14,23,17,12,17,14,9,21],cross:[1,21,2,1],
  boundaries:[[1,18,{ko:/네 뿔/,en:/four horns/,ja:/四つの角/,zh:/四个角/}],[1,21,{ko:/공장들/,en:/craftsmen/,ja:/四人の者/,zh:/工匠/}],[2,1,{ko:/척량줄/,en:/measuring line/,ja:/測りなわ/,zh:/准绳/}],[4,6,{ko:/나의 신으로 되느니라/,en:/by My Spirit/,ja:/わたしの霊による/,zh:/乃靠我的灵/}],[9,9,{ko:/나귀/,en:/donkey/,ja:/ろば/,zh:/驴/}]]},
 malachi:{names:{ko:'말라기',en:'Malachi',ja:'マラキ書',zh:'玛拉基书'},counts:[14,17,18,6],cross:[3,18,4,1],
  boundaries:[[3,18,{ko:/의인과 악인/,en:/righteous and the wicked/,ja:/義人と悪人/,zh:/义人与恶人/}],[4,1,{ko:/풀무불 같은 날/,en:/burning like a furnace/,ja:/炉のように燃える日/,zh:/烧红的火炉/}],[4,6,{ko:/아비의 마음을 자녀에게로/,en:/hearts of the fathers/,ja:/父の心をその子供たち/,zh:/父亲的心转向儿女/}]]}};
for(const [book,{names,counts,boundaries,cross,bridges={}}] of Object.entries(minorProphets))for(const [lang,name] of Object.entries(names)){
 if(lang!=='ko')assert(actualCatalog[lang].books.includes(book),`${lang} ${book}`);
 counts.forEach((count,index)=>{
  const chapter=index+1,last=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(count),lang}));assert.equal(last.reference,`${name} ${chapter}:${count}`);assert.equal(last.verses.length,1);assert(last.text.trim());
  assert.throws(()=>actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(count+1),lang})));
 });
 for(const [chapter,verse,pattern] of boundaries)assert.match(actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang})).text,pattern[lang],`${lang} ${book} ${chapter}:${verse}`);
 if(cross){
  const [chapter,verse,endChapter,endVerse]=cross,shared=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),endChapter:String(endChapter),endVerse:String(endVerse),lang}));
  assert.equal(shared.lang,lang);assert.equal(shared.reference,chapter===endChapter?`${name} ${chapter}:${verse}–${endVerse}`:`${name} ${chapter}:${verse}–${endChapter}:${endVerse}`);assert.equal(shared.verses.length,2);assert(shared.text.trim());
  for(const [c,v,p] of boundaries)if((c===chapter&&v===verse)||(c===endChapter&&v===endVerse))assert.match(shared.text,p[lang],`${lang} ${book} shared ${c}:${v}`);
  if(lang!=='ko')assert(shared.attribution&&shareHTML(shared).includes(shared.attribution.split(' · ')[0].replaceAll('&','&amp;')),`${lang} ${book} attribution`);
 }
 const bridged=new Set((bridges[lang]||[]).map(([c,f])=>`${c}:${f}`));
 for(const [chapter,first,end] of Object.values(bridges).flat())for(const verse of [first,end]){
  const picked=actualSelection(new URLSearchParams({book,chapter:String(chapter),verse:String(verse),lang}));assert(picked.text.trim());assert.equal(picked.verses.length,1);
  assert.equal(picked.reference,bridged.has(`${chapter}:${first}`)?`${name} ${chapter}:${first}–${end}`:`${name} ${chapter}:${verse}`,`${lang} ${book} ${chapter}:${verse}`);
 }
}
const zepRange=actualSelection(new URLSearchParams({book:'zephaniah',chapter:'2',verse:'1',endChapter:'2',endVerse:'3',lang:'zh'}));assert.equal(zepRange.reference,'西番雅书 2:1–3');assert.equal(zepRange.verses.length,2);assert.match(zepRange.text,/聚集/);assert.match(zepRange.text,/谦卑/);
console.log('Joel–Malachi: four-language chapter-final verses for all 10 books, Hebrew/English boundary verses (Joel 2:28–3:1, Micah 4:13–5:2, Nahum 1:15–2:1, Zechariah 1:18–2:1, Malachi 3:18–4:6), cross-chapter shared ranges, OpenCCB Zephaniah 2:1–2 and 2:8–9 and attribution verified.');
const zepCross=actualSelection(new URLSearchParams({book:'zephaniah',chapter:'1',verse:'18',endChapter:'2',endVerse:'1',lang:'zh'}));assert.equal(zepCross.reference,'西番雅书 1:18–2:2');assert.equal(zepCross.verses.length,2);
for(const lang of ['ko','en','ja'])assert.equal(actualSelection(new URLSearchParams({book:'zephaniah',chapter:'1',verse:'18',endChapter:'2',endVerse:'1',lang})).verses.length,2);
for(const book of Object.keys(minorProphets))for(const lang of ['ko','en','ja','zh'])assert.doesNotMatch(JSON.stringify(actualSelection(new URLSearchParams({book,chapter:'1',verse:'1',lang}))),/절과 같음/);

const {cardNotice}=await import('./api/share-card.mjs'),{findScripture}=await import('./scripture-search.js');
// Korean editions. The shipped registry has only 개역한글 (base), so the menu stays hidden and nothing changes.
{
 const lang=await import('./languages.js');
 const shipped=lang.validateEditions(JSON.parse(await fs.readFile(new URL('./data/translations/editions.json',import.meta.url),'utf8')));
 assert.deepEqual(lang.editionList(shipped,'ko').map(e=>[e.id,!!e.base]),[['krv',true]]);assert.equal(shipped.languages.ko.default,'krv');
 for(const l of ['en','ja','zh'])assert.deepEqual(lang.editionList(shipped,l),[],`${l} keeps its single translation`);
 for(const book of actualCatalog.ko.books){assert.equal(lang.editionForBook(shipped,'ko',book,'krv').id,'krv');assert.equal(lang.editionMenu(shipped,'ko',book,'krv').visible,false);}
 assert.equal(lang.searchIndexFile('ko',lang.activeEdition(shipped,'ko',null)),'data/search/ko.json');
 assert.equal(lang.searchIndexFile('ko',lang.activeEdition(shipped,'ko','unknown')),'data/search/ko.json');
 assert.equal(await lang.loadEditionText({},{registry:shipped,lang:'ko',book:'john',preferred:'krv',fetchImpl:()=>assert.fail('no extra file is read')}),null);
 const plain=actualSelection(new URLSearchParams({book:'john',chapter:'3',verse:'16'}));
 assert.equal(plain.path,'/share/john/3/16');assert.equal(plain.edition,undefined);assert.equal(plain.editionParam,undefined);assert.equal(cardNotice(plain),'개역한글');
 assert.equal(actualSelection(new URLSearchParams({book:'john',chapter:'3',verse:'16',ed:'krv'})).path,'/share/john/3/16');
 assert.deepEqual(actualSelection(new URLSearchParams({book:'john',chapter:'3',verse:'16',ed:'missing'})),plain,'an unknown edition falls back to the usual text');
 assert(!shareHTML(plain).includes('ed='));
 assert.equal(actualSelection(new URLSearchParams({book:'john',chapter:'3',verse:'16',lang:'en',ed:'krv'})).path,'/share/john/3/16?lang=en');
 const html=await fs.readFile(new URL('./index.html',import.meta.url),'utf8'),app=await fs.readFile(new URL('./app.js',import.meta.url),'utf8');
 assert.match(html,/<label id="edition-setting" class="menu-edition" hidden>/);for(const call of ['editionMenu(','loadEditionText(','searchIndexFile(','shareEditionId(','saveEdition('])assert(app.includes(call),call);
 const base={id:'krv',base:true,names:{ko:'가',en:'A',ja:'あ',zh:'甲'},translation:'T',attribution:'A',source:'https://example.com',licenseSource:'https://example.com/l'};
 const extra={...base,id:'test',base:undefined,path:'ko-test',books:['john'],permissions:{display:true,shareCards:true}};
 const registry=editions=>({version:1,languages:{ko:{default:'krv',editions}}});
 lang.validateEditions(registry([base,extra]));
 for(const bad of [registry([base,{...extra,path:'ko'}]),registry([base,{...extra,permissions:{display:true}}]),registry([base,{...base,id:'other'}]),registry([extra]),{version:1,languages:{ko:{default:'none',editions:[base]}}},registry([base,{...extra,names:{ko:'가'}}]),registry([base,{...extra,books:[]}]),{version:1,languages:{xx:{default:'krv',editions:[base]}}}])assert.throws(()=>lang.validateEditions(bad));
 console.log('Edition registry: only 개역한글 ships; the menu is hidden, links, share pages, cards and search are unchanged; invalid registries are rejected.');
}

// A synthetic second Korean edition (placeholder text only, temporary copy) turns everything on after a web build alone.
{
 const repo=path.dirname(new URL(import.meta.url).pathname),copy=await fs.mkdtemp(path.join(os.tmpdir(),'vible-edition-tests-'));
 try{
  for(const entry of await fs.readdir(repo,{withFileTypes:true})){
   if(['assets','node_modules'].includes(entry.name))await fs.symlink(path.join(repo,entry.name),path.join(copy,entry.name));
   else if(entry.isFile()||['data','fonts','icons','.well-known','scripts','api'].includes(entry.name))await fs.cp(path.join(repo,entry.name),path.join(copy,entry.name),{recursive:true});
  }
  const john=JSON.parse(await fs.readFile(path.join(repo,'data/john.json'),'utf8')),meta={translation:'TEST-EDITION',attribution:'TEST-EDITION attribution © placeholder',source:'https://example.com/test-edition',licenseSource:'https://example.com/test-edition/license'};
  const chapters=[];for(const s of john.scenes)for(const v of s.verses){let c=chapters.find(c=>c.chapter===s.chapter);if(!c)chapters.push(c={chapter:s.chapter,verses:[]});c.verses.push({verse:v.verse,text:`TEST-EDITION ${s.chapter}:${v.verse}`});}
  await fs.mkdir(path.join(copy,'data/translations/ko-test'));
  await fs.writeFile(path.join(copy,'data/translations/ko-test/john.json'),JSON.stringify({language:'ko',book:john.book,...meta,permissions:{display:true,shareCards:true},chapters}));
  const registryFile=path.join(copy,'data/translations/editions.json'),registry=JSON.parse(await fs.readFile(registryFile,'utf8'));
  registry.languages.ko.editions.push({id:'test',names:{ko:'테스트판',en:'Test edition',ja:'テスト版',zh:'测试版'},...meta,path:'ko-test',books:['john'],permissions:{display:true,shareCards:true}});
  await fs.writeFile(registryFile,JSON.stringify(registry));
  execFileSync(process.execPath,['build.mjs'],{cwd:copy,stdio:'ignore',env:{...process.env,VIBLE_SOURCE_COMMIT:''}});
  const dist=file=>fs.readFile(path.join(copy,'dist',file),'utf8');
  assert.equal(await dist('data/search/ko.json'),await fs.readFile(path.join(repo,'dist/data/search/ko.json'),'utf8'),'the 개역한글 index is unchanged');
  const index=JSON.parse(await dist('data/search/ko-test.json')),baseIndex=JSON.parse(await dist('data/search/ko.json'));
  assert.equal(index.verses.length,baseIndex.verses.length);
  assert.deepEqual(index.verses.filter(r=>r[0]!=='john'),baseIndex.verses.filter(r=>r[0]!=='john'),'books the edition lacks keep 개역한글 in its index');
  assert(index.verses.filter(r=>r[0]==='john').every(r=>r[3]===`TEST-EDITION ${r[1]}:${r[2]}`));
  assert.equal(findScripture(index,'TEST-EDITION').total,john.verseCount);assert.equal(findScripture(baseIndex,'TEST-EDITION').total,0);
  assert.equal(findScripture(index,'요 3:16').results[0].text,'TEST-EDITION 3:16');
  const shipped=JSON.parse(await dist('data/translations/editions.json'));
  const {validateEditions,editionMenu,loadEditionText,searchIndexFile,activeEdition,savedEdition,saveEdition,editionStorageKey,shareEditionId}=await import('./languages.js');
  validateEditions(shipped);
  // Reader: the ☰ menu lists both editions only for Korean; the choice persists and applies per book.
  const menu=editionMenu(shipped,'ko','john','krv');assert.equal(menu.visible,true);assert.deepEqual(menu.options.map(o=>[o.id,o.label,o.disabled]),[['krv','개역한글 (1961)',false],['test','테스트판',false]]);
  assert.equal(editionMenu(shipped,'ko','genesis','krv').options[1].disabled,true,'an edition without this book cannot be chosen there');
  assert.equal(editionMenu(shipped,'en','john','').visible,false);
  const stored=new Map(),storage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)};
  assert.equal(savedEdition(storage,'ko'),null);saveEdition(storage,'ko','test');assert.equal(stored.get('vible-edition-ko'),'test');assert.equal(editionStorageKey('ko'),'vible-edition-ko');assert.equal(savedEdition(storage,'ko'),'test');
  assert.equal(savedEdition({getItem(){throw Error('blocked');}},'ko'),null);
  const fetchImpl=async file=>{try{return new Response(await dist(file));}catch{return new Response('',{status:404});}};
  const baseJohn=JSON.parse(await dist('data/john.json')),baseGenesis=JSON.parse(await dist('data/genesis.json'));
  const chosen=await loadEditionText(baseJohn,{registry:shipped,lang:'ko',book:'john',preferred:savedEdition(storage,'ko'),fetchImpl});
  assert.equal(chosen.edition,'test');assert.equal(chosen.translation,'TEST-EDITION');assert.equal(chosen.attribution,meta.attribution);assert.equal(chosen.copyrightSource,meta.licenseSource);
  assert.equal(chosen.scenes[0].verses[0].text,'TEST-EDITION 1:1');assert.equal(chosen.scenes[0].title,baseJohn.scenes[0].title);assert.deepEqual(chosen.scenes.map(s=>s.image),baseJohn.scenes.map(s=>s.image));
  assert.equal(chosen.scenes.flatMap(s=>s.verses).length,baseJohn.verseCount);
  assert.equal(await loadEditionText(baseGenesis,{registry:shipped,lang:'ko',book:'genesis',preferred:'test',fetchImpl}),null,'books the edition lacks show 개역한글');
  assert.equal(await loadEditionText(baseJohn,{registry:shipped,lang:'ko',book:'john',preferred:'krv',fetchImpl}),null);
  assert.equal(await loadEditionText(baseJohn,{registry:shipped,lang:'ko',book:'john',preferred:'test',fetchImpl:async()=>new Response('',{status:404})}),null,'an unreachable edition file falls back to the whole base book');
  assert.equal(searchIndexFile('ko',activeEdition(shipped,'ko','test')),'data/search/ko-test.json');assert.equal(searchIndexFile('ko',activeEdition(shipped,'ko',null)),'data/search/ko.json');
  assert.equal(shareEditionId(shipped,'ko','john','test'),'test');assert.equal(shareEditionId(shipped,'ko','john','krv'),'');
  // Share pages and cards: `ed` selects the edition and its attribution; anything unavailable shows 개역한글 and drops `ed`.
  const {selection,shareParams}=await import(pathToFileURL(path.join(copy,'share-data.mjs')));const {shareHTML:copyHTML}=await import(pathToFileURL(path.join(copy,'api/share.mjs')));
  const pick=url=>selection(shareParams(new URL(url,'https://vible.now')));
  const shared=pick('/share/john/3/16/3/17?ed=test'),page=copyHTML(shared);
  assert.equal(shared.text,'TEST-EDITION 3:16\nTEST-EDITION 3:17');assert.equal(shared.path,'/share/john/3/16/3/17?ed=test');assert.equal(shared.edition,'test');
  assert.equal(shared.attribution,meta.attribution);assert.equal(cardNotice(shared),meta.attribution);
  assert(page.includes(meta.attribution));assert(page.includes('TEST-EDITION')&&page.includes('lang=ko&amp;ed=test&amp;v='),'the card URL keeps the edition');assert(page.includes('&read=1&lang=ko&ed=test'));assert(page.includes('https://vible.now/share/john/3/16/3/17?ed=test'));
  assert.equal(pick('/api/share?book=john&chapter=3&verse=16&ed=test').text,'TEST-EDITION 3:16');
  const original=pick('/share/john/3/16');assert.equal(original.path,'/share/john/3/16');assert(!original.text.includes('TEST-EDITION'));assert.equal(cardNotice(original),'개역한글');
  for(const url of ['/share/genesis/1/1?ed=test','/share/john/3/16?ed=unknown']){const s=pick(url);assert(!s.text.includes('TEST-EDITION'),url);assert(!s.path.includes('ed='),url);assert.equal(s.attribution,'성경전서 개역한글판 © 대한성서공회 1961.');}
  const english=pick('/share/john/3/16?lang=en&ed=test');assert.equal(english.lang,'en');assert.equal(english.path,'/share/john/3/16?lang=en');assert.match(english.text,/God so loved/);
  // The service worker caches the registry, edition texts and edition search indexes for offline reading.
  const sw=await dist('sw.js');assert(sw.includes("'./data/translations/editions.json'"));
  console.log('Synthetic second Korean edition: build validation and its own search index, menu, persisted choice, per-book fallback, share links, pages and card attribution verified.');
 }finally{await fs.rm(copy,{recursive:true,force:true});}
}
