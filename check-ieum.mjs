import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {bibleBooks} from './bible-books.js';
import {applyTranslation,validateEditions,editionForBook,searchIndexFile,activeEdition} from './languages.js';
import {selection,shareParams,cardVersion} from './share-data.mjs';
import {shareHTML} from './api/share.mjs';
import {cardNotice} from './api/share-card.mjs';
import {findScripture} from './scripture-search.js';
const read=async file=>JSON.parse(await fs.readFile(new URL(file,import.meta.url),'utf8'));
const registry=validateEditions(await read('data/translations/editions.json'));
assert.equal(registry.languages.ko.default,'ieum');
let count=0,chapters=0;
for(const {id} of bibleBooks){
 const original=await read(`data/${id}.json`),ieum=await read(`data/translations/ko-ieum/${id}.json`),result=applyTranslation(original,ieum,'ko');
 assert.equal(editionForBook(registry,'ko',id).id,'ieum');
 assert.equal(result.translation,'이음성경');assert.match(result.attribution,/전문가 검토 전 AI 번역 초안/);assert.equal(result.copyrightSource,'https://ieumbible.org/');
 assert.deepEqual(result.scenes.map(s=>[s.id,s.image]),original.scenes.map(s=>[s.id,s.image]),`${id} retains every scene and image`);
 const expected=ieum.chapters.flatMap(c=>c.verses.map(v=>[c.chapter,v.verse,v.text]));
 assert.deepEqual(result.scenes.flatMap(s=>s.verses.map(v=>[s.chapter,v.verse,v.text])),expected,`${id}: no lost or repeated source verses`);
 assert.equal(result.verseCount,expected.length);count+=expected.length;chapters+=ieum.chapters.length;
 for(const c of ieum.chapters){
  for(const v of [c.verses[0],c.verses.at(-1)]){
   const picked=selection(new URLSearchParams({book:id,chapter:c.chapter,verse:v.verse}));
   assert.equal(picked.edition,'ieum');assert.equal(picked.text,v.text);assert(!picked.path.includes('ed='));
  }
 }
 const shared=selection(new URLSearchParams({book:id,chapter:1,verse:1})),page=shareHTML(shared);
 assert(page.includes('이음성경'));assert(page.includes('href="https://ieumbible.org/"'));assert.equal(cardNotice(shared),ieum.attribution);
 const previous=selection(new URLSearchParams({book:id,chapter:1,verse:1,ed:'nkrv'}));
 assert.equal(previous.translation,'개역개정');assert(previous.path.includes('ed=nkrv'));assert.notEqual(cardVersion(shared),cardVersion(previous));
}
assert.equal(count,31104);assert.equal(chapters,1189);
const pick=path=>selection(shareParams(new URL(path,'https://vible.now')));
assert.match(pick('/share/2corinthians/13/14').text,/성령의 친교/);
assert.match(pick('/share/revelation/12/18').text,/바다 모래/);
assert.equal(pick('/share/revelation/12/18/13/1').verses.length,2);
assert.equal(pick('/share/songofsongs/6/13').verses.length,1);
assert.throws(()=>pick('/share/songofsongs/6/14'));
const index=await read('dist/data/search/ko-ieum.json');
assert.equal(index.verses.length,count);
const john=await read('data/translations/ko-ieum/john.json'),verse=john.chapters[2].verses[15];
assert.equal(findScripture(index,'요 3:16').results[0].text,verse.text);
assert.equal(searchIndexFile('ko',activeEdition(registry,'ko')),'data/search/ko-ieum.json');
const baseIndex=await read('dist/data/search/ko.json');assert.notEqual(findScripture(baseIndex,'요 3:16').results[0].text,verse.text);
const html=await fs.readFile(new URL('index.html',import.meta.url),'utf8');assert.match(html,/<a id="translation-edition"[^>]+href="https:\/\/ieumbible.org\/"/);
console.log(`Ieum: 66 books, ${chapters} chapters, ${count} exact source verses, all chapter ends, verse-number differences, images, default search, attribution links and card cache versions verified.`);
