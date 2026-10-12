import assert from 'node:assert/strict';
import {selection,shareParams} from './share-data.mjs';
import {cardLayout} from './share-card-layout.mjs';
import {shareHTML} from './api/share.mjs';

const pick=path=>selection(shareParams(new URL(path,'https://vible.now')));
const one=pick('/share/acts/4/32'),html=shareHTML(one);
assert.equal(one.verses.length,1);
assert.equal(one.reference,'사도행전 4:32');
assert(html.includes(one.text));
assert(html.includes('<meta property="og:description"'));
assert(html.includes('https://vible.now/api/share-card?book=acts'));
assert(!html.includes('4장 33절'));
assert(html.includes('read=1'),'Continue reading must bypass the shared-only page');
const range=pick('/share/acts/4/32/4/35');
assert.deepEqual(range.verses.map(v=>v.verse),[32,33,34,35]);
assert.equal(range.reference,'사도행전 4:32–35');
const crossing=pick('/share/john/3/36/4/2');
assert.deepEqual(crossing.verses.map(v=>[v.chapter,v.verse]),[[3,36],[4,1],[4,2]]);
assert.equal(pick('/?book=acts&chapter=4&verse=32').path,one.path);
for(const path of ['/share/acts/99/1','/share/acts/4/33/4/32','/share/invalid/1/1','/?book=acts&chapter=4&verse=32&endVerse=oops'])assert.throws(()=>pick(path));
console.log('Shared-only content, complete ranges, legacy links, OG metadata and invalid addresses verified.');

const genesis=pick('/share/genesis/50/20/50/21');
assert.equal(genesis.reference,'창세기 50:20–21');
assert.equal(genesis.verses.length,2);
assert(genesis.text.includes('선으로 바꾸사'));
assert.equal(genesis.image,'genesis-271-right-v1.jpg');
const revelation=pick('/share/revelation/22/1/22/2');
assert.equal(revelation.reference,'요한계시록 22:1–2');
assert.equal(revelation.verses.length,2);
assert(revelation.text.includes('생명수'));
assert.equal(revelation.image,'revelation-092-right-v1.jpg');
const matthew=pick('/share/matthew/11/28/11/30');
assert.equal(matthew.reference,'마태복음 11:28–30');
assert.equal(matthew.verses.length,3);
assert(matthew.text.includes('내게로 오라'));
const mark=pick('/share/mark/7/34/7/35');
assert.equal(mark.reference,'마가복음 7:34–35');
assert(mark.text.includes('에바다'));
const luke=pick('/share/luke/15/20/15/24');
assert.equal(luke.reference,'누가복음 15:20–24');
assert.equal(luke.verses.length,5);
assert(luke.text.includes('측은히 여겨'));
for(const s of [one,range,pick('/share/romans/8/28'),revelation,genesis,matthew,mark,luke]){
 const html=shareHTML(s),layout=cardLayout(s);
 assert(html.includes(`<meta property="og:image:width" content="${layout.width}">`));
 assert(html.includes(`<meta property="og:image:height" content="${layout.height}">`));
 assert(html.includes('og:image:secure_url'));
 assert(html.includes('og:locale'));
 assert(!html.includes('preview='));
 assert(/&amp;v=[a-f0-9]{24}/.test(html));assert.equal(layout.textWidth,460);
}
assert.equal(cardLayout(pick('/share/romans/8/28')).height,675);
assert(cardLayout(range).height>675);
console.log('Crawler image dimensions, secure URLs and fresh preview identities verified.');

const partial=pick('/share/1corinthians/16/24');
assert.equal(partial.book,'1corinthians');assert.equal(partial.image,'1corinthians-124-right-v1.jpg');
assert.equal(pick('/share/1corinthians/1/1').image,'1corinthians-001-right-v1.jpg');
assert(partial.text.trim());assert(shareHTML(partial).includes('og:image'));
console.log('Complete Corinthians: numeric book links, first and final images, and full-text sharing verified.');

for(const lang of ['ko','en','ja','zh']){
 const selected=pick(`/share/john/3/16?lang=${lang}`),page=shareHTML(selected);
 const cardLink=page.match(/<a class="shared-card-link" href="([^"]+)"[^>]*><img id="shared-card"[^>]*><\/a>/);
 assert(cardLink,'Shared card is a keyboard-accessible reading link');
 const target=new URL(cardLink[1],'https://vible.now');
 assert.equal(target.searchParams.get('book'),'john');assert.equal(target.searchParams.get('chapter'),'3');assert.equal(target.searchParams.get('verse'),'16');assert.equal(target.searchParams.get('read'),'1');assert.equal(target.searchParams.get('lang'),lang);
 assert(page.includes(`<a href="/?lang=${lang}">vible.now</a>`));
}
console.log('Shared cards and footer URLs are real links; exact passage and all four languages preserved.');
for(const [lang,reference] of [['ko','아가 1:1'],['en','Song of Songs 1:1'],['ja','雅歌 1:1'],['zh','雅歌 1:1']]){
 const song=pick(`/share/songofsongs/1/1${lang==='ko'?'':`?lang=${lang}`}`),page=shareHTML(song);
 assert.equal(song.reference,reference);assert.equal(song.image,'songofsongs-c001-v001-001-right-context-v1.jpg');assert(page.includes(song.text));assert(page.includes('book=songofsongs'));
 if(lang!=='ko')assert(page.includes(song.attribution.split(' · ')[0].replace(/&/g,'&amp;')),`${lang} attribution`);
}
console.log('Song of Songs share pages render in all four languages with translation attribution.');
for(const [book,ko,en,ja,zh,image] of [['1chronicles','역대상','1 Chronicles','歴代誌上','历代志上','1chronicles-001-right-v1.jpg'],['2chronicles','역대하','2 Chronicles','歴代誌下','历代志下','2chronicles-001-right-v1.jpg'],['ezra','에스라','Ezra','エズラ記','以斯拉记','ezra-001-right-v1.jpg'],['nehemiah','느헤미야','Nehemiah','ネヘミヤ記','尼希米记','nehemiah-001-right-v1.jpg'],['esther','에스더','Esther','エステル記','以斯帖记','esther-001-right-v1.jpg'],['job','욥기','Job','ヨブ記','约伯记','job-c001-v001-003-right-context-v1.jpg'],['ecclesiastes','전도서','Ecclesiastes','コヘレトの言葉','传道书','ecclesiastes-c001-v001-003-right-context-v1.jpg'],['daniel','다니엘','Daniel','ダニエル書','但以理书','daniel-c001-v001-002-right-context-v1.jpg'],['jonah','요나','Jonah','ヨナ書','约拿书','jonah-c001-v001-002-right-context-v1.jpg']]){
 for(const [lang,name] of [['ko',ko],['en',en],['ja',ja],['zh',zh]]){
  const shared=pick(`/share/${book}/1/1${lang==='ko'?'':`?lang=${lang}`}`),page=shareHTML(shared);
  assert.equal(shared.reference,`${name} 1:1`);assert.equal(shared.image,image);assert(page.includes(shared.text));assert(page.includes(`book=${book}`));
  if(lang!=='ko')assert(page.includes(shared.attribution.split(' · ')[0].replace(/&/g,'&amp;')),`${lang} ${book} attribution`);
 }
}
const bridgedShare=pick('/share/ecclesiastes/7/27/7/28?lang=zh');assert.equal(bridgedShare.reference,'传道书 7:27–28');assert(shareHTML(bridgedShare).includes(bridgedShare.text));
const jonahFish=pick('/share/jonah/1/17/2/1?lang=ja');assert.equal(jonahFish.reference,'ヨナ書 1:17–2:1');assert.match(jonahFish.text,/魚/);
console.log('Chronicles–Esther, Job, Ecclesiastes, Daniel and Jonah share pages render in all four languages with attribution, a bridged verse and a cross-chapter range.');

// Card URLs must change when a scene is replaced, even for the same passage.
const {cardVersion}=await import('./share-data.mjs');
const psalm=pick('/share/psalms/150/6');
assert.notEqual(cardVersion(psalm),cardVersion({...psalm,image:'psalms-c150-v006-006-right-context-finale-v3.jpg'}));
assert.notEqual(cardVersion(psalm),cardVersion({...psalm,text:psalm.text+'!'}));
assert.equal(cardVersion(psalm),cardVersion({...psalm}));
console.log('Shared card identity changes with original image or Scripture; stable passage links preserved.');
for(const [lang,name] of [['ko','예레미야애가'],['en','Lamentations'],['ja','哀歌'],['zh','耶利米哀歌']]){
 const shared=pick(`/share/lamentations/1/1${lang==='ko'?'':`?lang=${lang}`}`),page=shareHTML(shared);
 assert.equal(shared.reference,`${name} 1:1`);assert.equal(shared.image,'lamentations-c001-v001-003-right-context-v1.jpg');assert(page.includes(shared.text));assert(page.includes('book=lamentations'));
 if(lang!=='ko')assert(page.includes(shared.attribution.split(' · ')[0].replace(/&/g,'&amp;')),`${lang} lamentations attribution`);
 const range=pick(`/share/lamentations/3/22/3/23${lang==='ko'?'':`?lang=${lang}`}`);assert.equal(range.reference,`${name} 3:22–23`);assert.equal(range.image,'lamentations-c003-v019-024-right-context-v1.jpg');assert(shareHTML(range).includes(range.text));
}
const lamentCross=pick('/share/lamentations/2/22/3/1?lang=en');assert.equal(lamentCross.reference,'Lamentations 2:22–3:1');assert.match(lamentCross.text,/affliction/);
console.log('Lamentations share pages render in all four languages with attribution, a shared range and a cross-chapter range.');
for(const [lang,name] of [['ko','예레미야'],['en','Jeremiah'],['ja','エレミヤ書'],['zh','耶利米书']]){
 const shared=pick(`/share/jeremiah/1/1${lang==='ko'?'':`?lang=${lang}`}`),page=shareHTML(shared);
 assert.equal(shared.reference,`${name} 1:1`);assert.equal(shared.image,'jeremiah-c001-v001-003-right-context-v1.jpg');assert(page.includes(shared.text));assert(page.includes('book=jeremiah'));
 if(lang!=='ko')assert(page.includes(shared.attribution.split(' · ')[0].replace(/&/g,'&amp;')),`${lang} jeremiah attribution`);
 const range=pick(`/share/jeremiah/31/31/31/34${lang==='ko'?'':`?lang=${lang}`}`);assert.equal(range.reference,`${name} 31:31–34`);assert.equal(range.image,'jeremiah-c031-v031-034-right-context-v1.jpg');assert(shareHTML(range).includes(range.text));
}
const jerBridge=pick('/share/jeremiah/43/6?lang=zh');assert.equal(jerBridge.reference,'耶利米书 43:5–7');assert.match(jerBridge.text,/答比匿/);assert.equal(jerBridge.image,'jeremiah-c043-v001-007-right-context-v1.jpg');
const jerCross=pick('/share/jeremiah/8/22/9/1?lang=en');assert.equal(jerCross.reference,'Jeremiah 8:22–9:1');assert.match(jerCross.text,/balm in Gilead/);assert.match(jerCross.text,/spring of water/);
console.log('Jeremiah share pages render in all four languages with attribution, a shared range, an OpenCCB combined verse and a cross-chapter range.');
for(const [book,names,first,range,rangeImage] of [['ezekiel',{ko:'에스겔',en:'Ezekiel',ja:'エゼキエル書',zh:'以西结书'},'ezekiel-c001-v001-003-right-context-v1.jpg','37/1/37/6','ezekiel-c037-v001-006-right-context-v1.jpg'],['hosea',{ko:'호세아',en:'Hosea',ja:'ホセア書',zh:'何西阿书'},'hosea-c001-v001-005-right-context-v1.jpg','6/1/6/3','hosea-c006-v001-003-right-context-v1.jpg']])for(const [lang,name] of Object.entries(names)){
 const shared=pick(`/share/${book}/1/1${lang==='ko'?'':`?lang=${lang}`}`),page=shareHTML(shared);
 assert.equal(shared.reference,`${name} 1:1`);assert.equal(shared.image,first);assert(page.includes(shared.text));assert(page.includes(`book=${book}`));
 if(lang!=='ko')assert(page.includes(shared.attribution.split(' · ')[0].replace(/&/g,'&amp;')),`${lang} ${book} attribution`);
 const [c,v,ec,ev]=range.split('/'),ranged=pick(`/share/${book}/${range}${lang==='ko'?'':`?lang=${lang}`}`);assert.equal(ranged.reference,`${name} ${c}:${v}–${ev}`);assert.equal(ranged.image,rangeImage);assert(shareHTML(ranged).includes(ranged.text));
}
const ezkBridge=pick('/share/ezekiel/41/10?lang=zh');assert.equal(ezkBridge.reference,'以西结书 41:9–10');assert.match(ezkBridge.text,/厢房/);assert.equal(ezkBridge.image,'ezekiel-c041-v001-014-right-context-v1.jpg');
const ezkKorean=pick('/share/ezekiel/24/5');assert.equal(ezkKorean.reference,'에스겔 24:4–5');assert.doesNotMatch(shareHTML(ezkKorean),/4절과 같음/);assert.equal(ezkKorean.image,'ezekiel-c024-v001-014-right-context-v1.jpg');
const ezkCross=pick('/share/ezekiel/20/49/21/1?lang=ja');assert.equal(ezkCross.reference,'エゼキエル書 20:49–21:1');assert.match(ezkCross.text,/たとえ/);assert.match(ezkCross.text,/主の言葉がわたしに臨んだ/);
const hosCross=pick('/share/hosea/1/11/2/1?lang=en');assert.equal(hosCross.reference,'Hosea 1:11–2:1');assert.match(hosCross.text,/Jezreel/);assert.match(hosCross.text,/My people/);
const hosEnd=pick('/share/hosea/13/16/14/1?lang=zh');assert.equal(hosEnd.reference,'何西阿书 13:16–14:1');assert.match(hosEnd.text,/撒玛利亚/);assert.match(hosEnd.text,/归向你的上帝/);
console.log('Ezekiel and Hosea share pages render in all four languages with attribution, shared ranges, OpenCCB and KRV combined verses and cross-chapter ranges at the Hebrew/English boundaries.');
