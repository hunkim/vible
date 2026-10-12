import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createSearchIndex,findScripture,normalize,excerpt} from './scripture-search.js';
import {applyTranslation} from './languages.js';
const ids=['genesis',...(JSON.parse(await fs.readFile('pentateuch-books.json'))).map(b=>b.id),...(JSON.parse(await fs.readFile('historical-books.json'))).map(b=>b.id),'1chronicles','2chronicles','ezra','nehemiah','esther','job','ecclesiastes','daniel','jonah','jeremiah','lamentations','ezekiel','hosea','psalms','proverbs','songofsongs','isaiah','matthew','mark','luke','john','acts','romans',...(JSON.parse(await fs.readFile('epistles-books.json'))).map(b=>b.id),'revelation'];
const books=await Promise.all(ids.map(async id=>({id,data:JSON.parse(await fs.readFile(`data/${id}.json`))})));
const index=createSearchIndex(books,'ko');assert.equal(index.books.length,56);assert.equal(index.verses.length,30288);
assert.equal(findScripture(index,'출 14:21').results[0].book,'exodus');
assert.equal(findScripture(index,'레 19:18').results[0].book,'leviticus');
assert.equal(findScripture(index,'민 6:24').results[0].book,'numbers');
const combined=findScripture(index,'신 30:10');assert.equal(combined.total,1);assert.equal(combined.results[0].verse,9);assert.equal(combined.results[0].endVerse,10);
for(const query of ['요 3:16','요한복음 3장 16절','John 3:16','ｊｏｈｎ ３：１６','ヨハネ 3:16','约 3:16']){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,'john');assert.equal(found.results[0].verse,16);}
assert.equal(findScripture(index,'엡6:24').results[0].book,'ephesians');
assert.equal(findScripture(index,'1 Corinthians 13:4-7').total,4);
assert.equal(findScripture(index,'요 3').total,36);
assert.equal(findScripture(index,'계22:21').results[0].book,'revelation');
assert.equal(findScripture(index,'요 999:999').total,0);
assert.equal(findScripture(index,'').total,0);
assert.equal(findScripture(index,'존재하지않는검색어123XYZ').total,0);
const phrase=findScripture(index,'두려워 말라');assert(phrase.total>0);assert(normalize(phrase.results[0].text).includes('두려워말라'));assert(phrase.results.every(v=>normalize(v.text).includes('두려워')&&normalize(v.text).includes('말라')));
const love=findScripture(index,'사랑',{book:'ephesians',limit:2});assert(love.total>2);assert.equal(love.results.length,2);assert(love.results.every(v=>v.book==='ephesians'));
for(const result of findScripture(index,'은혜',{limit:1000}).results){const data=books.find(b=>b.id===result.book).data;const scene=data.scenes[result.scene-1];assert.equal(scene.chapter,result.chapter);assert(scene.verses.some(v=>v.verse===result.verse&&v.text===result.text));assert(index.books.find(b=>b.id===result.book).images[result.scene-1]===scene.image);}
const english=createSearchIndex([{id:'john',data:applyTranslation(books.find(b=>b.id==='john').data,JSON.parse(await fs.readFile('data/translations/en/john.json')),'en')}],'en');
assert.equal(findScripture(english,'John 3:16').total,1);assert(findScripture(english,'love').total>0);assert.equal(findScripture(english,'사랑').total,0);assert.equal(findScripture(english,'창 1:1').total,0);
assert(excerpt('x'.repeat(400)+'은혜'+'x'.repeat(400),'은혜').includes('은혜'));
const unsafe=findScripture(index,'<script>');assert.equal(unsafe.total,0);
console.log('Scripture search: all 56 books and 30288 entries, KRV combined verses, multilingual references, chapter/range lookup, phrase matching, book scope, limits, exact scene targets and translated text verified.');

// Run the actual search UI handlers, including uncommitted IME input.
const {scriptureSearch}=await import('./search-ui.js');
class SearchElement extends EventTarget {
 constructor(){super();this.value='';this.children=[];this.style={setProperty(){}};this.classList={toggle(){}};this.open=false;this.offsetWidth=620;this.scrollTop=0;}
 append(...children){this.children.push(...children);}
 replaceChildren(){this.children=[];}
 get firstChild(){return this.children[0];}
 setAttribute(key){if(key==='open')this.open=true;}
 focus(){document.activeElement=this;}
 showModal(){this.open=true;}
 close(){this.open=false;queueMicrotask(()=>this.dispatchEvent(new Event('close')));}
 getBoundingClientRect(){return {left:150,bottom:48};}
 contains(target){return target===this;}
 querySelectorAll(){return this.children.filter(child=>child.className==='scripture-result');}
}
const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,new SearchElement());return elements.get(id);};
const globals={document:globalThis.document,window:globalThis.window,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight,fetch:globalThis.fetch};
try{
 globalThis.document=Object.assign(new EventTarget(),{getElementById:get,createElement:()=>new SearchElement(),createTextNode:text=>({textContent:text})});
 globalThis.window={addEventListener(){}};globalThis.innerWidth=375;globalThis.innerHeight=700;
 globalThis.fetch=async()=>({ok:true,json:async()=>index});
 scriptureSearch(()=>({ready:true,language:'ko',bookId:'genesis',name:'창세기'}),async()=>{});
 const header=get('header-query');header.focus();header.dispatchEvent(new Event('compositionstart'));header.value='사랑';header.dispatchEvent(new Event('input'));
 await new Promise(resolve=>setTimeout(resolve,160));
 assert(get('scripture-search').open);assert.equal(document.activeElement,header,'Live results preserve IME focus');assert.equal(get('scripture-results').querySelectorAll().length,30);
 // Result thumbnails use the reader's image URLs (CDN for released art, bundled placeholder otherwise), never a bare assets/ path.
 {const ui=await fs.readFile('search-ui.js','utf8');assert(ui.includes('img.src=assetURL(')&&!ui.includes('`assets/${'),'search thumbnails must go through assetURL');}
 header.value='요 3:16';header.dispatchEvent(new Event('input'));await new Promise(resolve=>setTimeout(resolve,160));
 assert.equal(get('scripture-results').querySelectorAll().length,1,'Latest typed reference replaces prior results');
 header.value='';header.dispatchEvent(new Event('input'));await Promise.resolve();assert(!get('scripture-search').open);assert.equal(document.activeElement,header,'Clearing keeps typing available');
 header.value='은혜';header.dispatchEvent(new Event('input'));await new Promise(resolve=>setTimeout(resolve,160));
 get('close-header-search').onclick();await Promise.resolve();assert(!get('scripture-search').open);assert.equal(header.value,'');assert.equal(document.activeElement,get('reader'));
}finally{Object.assign(globalThis,globals);}
console.log('Live search: composing input, focus preservation, latest query, empty input and mobile X collapse verified.');

assert.equal(findScripture(index,'잠 3:5').results[0].book,'proverbs');
assert.equal(findScripture(index,'아 8:6').results[0].book,'songofsongs');assert.equal(findScripture(index,'아가 2:1').results[0].book,'songofsongs');
for(const [lang,query,word] of [['en','Song of Songs 8:7','waters'],['ja','雅歌 8:7','大水'],['zh','雅歌 8:7','大水']]){const song=createSearchIndex([{id:'songofsongs',data:applyTranslation(books.find(b=>b.id==='songofsongs').data,JSON.parse(await fs.readFile(`data/translations/${lang}/songofsongs.json`)),lang)}],lang);assert.equal(findScripture(song,query).results[0].verse,7,`${lang} reference`);assert(findScripture(song,word).total>0,`${lang} text`);}
console.log('Song of Songs: Korean abbreviations and English/Japanese/Chinese translated reference and text search verified.');

for(const [query,id,chapter,verse] of [['대상 16:34','1chronicles',16,34],['대하 7:14','2chronicles',7,14],['스 7:10','ezra',7,10],['느 8:10','nehemiah',8,10],['에 4:14','esther',4,14],['욥 19:25','job',19,25],['전 3:1','ecclesiastes',3,1],['단 6:22','daniel',6,22],['욘 1:17','jonah',1,17],['요나 4:11','jonah',4,11],['전도서 12:1','ecclesiastes',12,1]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,id,query);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);}
// One-syllable Korean abbreviations resolve only as references with a chapter number; ordinary words stay text searches.
for(const word of ['에','전','단','스','느']){const found=findScripture(index,`${word} 하나님`);assert.equal(found.address,false,word);}
assert.equal(findScripture(index,'요 3:16').results[0].book,'john');assert.equal(findScripture(index,'아 8:6').results[0].book,'songofsongs');
const otBatch=[['1chronicles','1 Chronicles 16:34','歴代誌上 16:34','代上 16:34','Give thanks','感謝','称谢'],['2chronicles','2 Chronicles 7:14','歴代誌下 7:14','代下 7:14','humble','へりくだ','谦卑'],['ezra','Ezra 7:10','エズラ記 7:10','拉 7:10','Law','律法','律法'],['nehemiah','Nehemiah 8:10','ネヘミヤ記 8:10','尼 8:10','joy','喜び','喜乐'],['esther','Esther 4:14','エステル記 4:14','斯 4:14','such a time','この時','今日之时'],['job','Job 19:25','ヨブ記 19:25','伯 19:25','Redeemer','あがなう','救赎主'],['ecclesiastes','Ecclesiastes 3:1','コヘレトの言葉 3:1','传 3:1','season','時','定时'],['daniel','Daniel 6:22','ダニエル書 6:22','但 6:22','lions','ししの','狮子'],['jonah','Jonah 1:17','ヨナ書 1:17','拿 1:17','fish','魚','鱼']];
for(const [id,en,ja,zh,enWord,jaWord,zhWord] of otBatch){
 const ko=books.find(b=>b.id===id).data;
 for(const [lang,query,word] of [['en',en,enWord],['ja',ja,jaWord],['zh',zh,zhWord]]){
  const translated=createSearchIndex([{id,data:applyTranslation(ko,JSON.parse(await fs.readFile(`data/translations/${lang}/${id}.json`)),lang)}],lang);
  const [,chapter,verse]=query.match(/(\d+):(\d+)$/);const found=findScripture(translated,query);
  assert.equal(found.results[0]?.book,id,`${lang} ${query}`);assert.equal(found.results[0].chapter,Number(chapter));assert.equal(found.results[0].verse,Number(verse));
  assert(findScripture(translated,word).total>0,`${lang} ${id} text ${word}`);
 }
}
console.log('Chronicles–Esther, Job, Ecclesiastes, Daniel and Jonah: Korean abbreviations and English/Japanese/Chinese reference and text search verified.');

for(const [query,chapter,verse] of [['애 3:23',3,23],['애가 1:1',1,1],['예레미야애가 5:21',5,21]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,'lamentations',query);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);}
assert.equal(findScripture(index,'애 3').total,66);assert.equal(findScripture(index,'애 3').results[0].book,'lamentations');
assert.equal(findScripture(index,'애 하나님').address,false);assert.equal(findScripture(index,'애굽 땅').address,false);
for(const [lang,query,word] of [['en','Lamentations 3:23','faithfulness'],['ja','哀歌 3:23','真実'],['zh','哀 3:23','信实']]){const lam=createSearchIndex([{id:'lamentations',data:applyTranslation(books.find(b=>b.id==='lamentations').data,JSON.parse(await fs.readFile(`data/translations/${lang}/lamentations.json`)),lang)}],lang);const found=findScripture(lam,query);assert.equal(found.results[0]?.book,'lamentations',`${lang} ${query}`);assert.equal(found.results[0].chapter,3);assert.equal(found.results[0].verse,23);assert(findScripture(lam,word).total>0,`${lang} text ${word}`);}
console.log('Lamentations: Korean abbreviation 애 with chapter only, full names and English/Japanese/Chinese reference and text search verified.');

for(const [query,chapter,verse] of [['렘 29:11',29,11],['예레미야 31:31',31,31],['렘 1:5',1,5]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,'jeremiah',query);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);}
assert.equal(findScripture(index,'렘 51').total,64);assert.equal(findScripture(index,'렘 51').results[0].book,'jeremiah');
assert.equal(findScripture(index,'예레미야애가 3:23').results[0].book,'lamentations');
for(const [lang,query,word,chapter,verse] of [['en','Jeremiah 29:11','plans I have for you',29,11],['ja','エレミヤ書 31:31','新しい契約',31,31],['zh','耶 31:31','另立新约',31,31],['zh','耶利米书 11:22','亚拿突',11,21]]){const jer=createSearchIndex([{id:'jeremiah',data:applyTranslation(books.find(b=>b.id==='jeremiah').data,JSON.parse(await fs.readFile(`data/translations/${lang}/jeremiah.json`)),lang)}],lang);const found=findScripture(jer,query);assert.equal(found.results[0]?.book,'jeremiah',`${lang} ${query}`);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);assert(findScripture(jer,word).total>0,`${lang} text ${word}`);}
console.log('Jeremiah: Korean abbreviation 렘 with chapter numbers, full names, OpenCCB combined verse lookup and English/Japanese/Chinese reference and text search verified.');
for(const [query,book,chapter,verse] of [['겔 37:3','ezekiel',37,3],['에스겔 36:26','ezekiel',36,26],['겔 1:1','ezekiel',1,1],['호 6:6','hosea',6,6],['호세아 14:4','hosea',14,4],['호 11:12','hosea',11,12]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,book,query);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);}
assert.equal(findScripture(index,'겔 37').total,28);assert.equal(findScripture(index,'겔 37').results[0].book,'ezekiel');assert.equal(findScripture(index,'호 2').total,23);assert.equal(findScripture(index,'호 2').results[0].book,'hosea');
for(const query of ['겔','호','호 하나님','겔 마른 뼈'])assert.equal(findScripture(index,query).address,false,query);
const potKo=findScripture(index,'겔 24:5');assert.equal(potKo.total,1);assert.equal(potKo.results[0].verse,4);assert.equal(potKo.results[0].endVerse,5);assert.equal(findScripture(index,'겔 24').total,26);assert.equal(findScripture(index,'4절과 같음').total,0);
for(const [book,lang,query,word,chapter,verse] of [['ezekiel','en','Ezekiel 37:4','Dry bones',37,4],['ezekiel','ja','エゼキエル書 36:26','新しい心',36,26],['ezekiel','zh','结 37:3','骸骨',37,3],['ezekiel','zh','以西结书 41:10','厢房',41,9],['hosea','en','Hosea 6:6','mercy, not sacrifice',6,6],['hosea','ja','ホセア書 14:4','喜んでこれを愛する',14,4],['hosea','zh','何 6:6','怜悯',6,6]]){const translated=createSearchIndex([{id:book,data:applyTranslation(books.find(b=>b.id===book).data,JSON.parse(await fs.readFile(`data/translations/${lang}/${book}.json`)),lang)}],lang);const found=findScripture(translated,query);assert.equal(found.results[0]?.book,book,`${lang} ${query}`);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);assert(findScripture(translated,word).total>0,`${lang} text ${word}`);}
console.log('Ezekiel and Hosea: Korean abbreviations 겔 and 호 only with chapter numbers, full names, KRV 24:4–5, OpenCCB combined verse lookup and English/Japanese/Chinese reference and text search verified.');
for(const [query,chapter,verse] of [['사 9:6',9,6],['이사야 53:5',53,5],['사 40:31',40,31],['사 9:1',9,1],['사 64:1',64,1],['사 1:18',1,18]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].book,'isaiah',query);assert.equal(found.results[0].chapter,chapter);assert.equal(found.results[0].verse,verse);}
assert.equal(findScripture(index,'사 53').total,12);assert.equal(findScripture(index,'사 53').results[0].book,'isaiah');assert.equal(findScripture(index,'사 7').total,24);assert.equal(findScripture(index,'사 66').total,24);
const isaBridge=findScripture(index,'사 7:9');assert.equal(isaBridge.total,1);assert.equal(isaBridge.results[0].verse,8);assert.equal(isaBridge.results[0].endVerse,9);
for(const [query,verse] of [['사 30:2',1],['사 48:2',1]]){const found=findScripture(index,query);assert.equal(found.total,1,query);assert.equal(found.results[0].verse,verse);assert.equal(found.results[0].endVerse,2);}
for(const query of ['8절과 같음','1절과 같음'])assert.equal(findScripture(index,query).total,0,query);
// The abbreviation 사 only resolves before a chapter number; ordinary words starting with 사 remain text searches.
for(const query of ['사','사 하나님','사랑','사람','사도','사랑 3'])assert.equal(findScripture(index,query).address,false,query);
for(const word of ['사랑','사람','사도']){const found=findScripture(index,word);assert(found.total>0,word);assert(found.results.every(r=>normalize(r.text).includes(word)),word);}
assert(findScripture(index,'사랑').results.some(r=>r.book!=='isaiah'));
for(const [query,book] of [['사사기 1:1','judges'],['삿 1:1','judges'],['사무엘상 1:1','1samuel'],['사도행전 2:1','acts']])assert.equal(findScripture(index,query).results[0].book,book,query);
for(const [lang,query,word,chapter,verse] of [['en','Isaiah 40:31','wings like eagles',40,31],['en','Isa 7:14','Immanuel',7,14],['ja','イザヤ書 9:6','平和の君',9,6],['ja','イザヤ書 4:4','生命の書',4,3],['zh','赛 53:5','鞭伤',53,5],['zh','以赛亚书 10:2','孤儿',10,1],['zh','以赛亚书 65:7','烧香',65,6]]){const translated=createSearchIndex([{id:'isaiah',data:applyTranslation(books.find(b=>b.id==='isaiah').data,JSON.parse(await fs.readFile(`data/translations/${lang}/isaiah.json`)),lang)}],lang);const found=findScripture(translated,query);assert.equal(found.results[0]?.book,'isaiah',`${lang} ${query}`);assert.equal(found.results[0].chapter,chapter,`${lang} ${query}`);assert.equal(found.results[0].verse,verse,`${lang} ${query}`);assert(findScripture(translated,word).total>0,`${lang} text ${word}`);}
console.log('Isaiah: Korean abbreviation 사 only with chapter numbers (사랑, 사람, 사도 stay text searches; 사사기, 사무엘상, 사도행전 unaffected), full names, KRV 7:8–9, 30:1–2, 48:1–2, Japanese/OpenCCB combined verse lookup and English/Japanese/Chinese reference and text search verified.');
