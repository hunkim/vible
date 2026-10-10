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
 assert(!html.includes('&amp;v='));assert.equal(layout.textWidth,460);
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
