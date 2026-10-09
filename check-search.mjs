import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createSearchIndex,findScripture,normalize,excerpt} from './scripture-search.js';
import {applyTranslation} from './languages.js';
const ids=['genesis','matthew','mark','luke','john','acts','romans',...(JSON.parse(await fs.readFile('epistles-books.json'))).map(b=>b.id),'revelation'];
const books=await Promise.all(ids.map(async id=>({id,data:JSON.parse(await fs.readFile(`data/${id}.json`))})));
const index=createSearchIndex(books,'ko');assert.equal(index.books.length,28);assert.equal(index.verses.length,9490);
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
console.log('Scripture search: all 9490 verses, multilingual references, chapter/range lookup, phrase matching, book scope, limits, exact scene targets and translated text verified.');
