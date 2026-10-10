import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createSearchIndex,findScripture,normalize,excerpt} from './scripture-search.js';
import {applyTranslation} from './languages.js';
const ids=['genesis',...(JSON.parse(await fs.readFile('pentateuch-books.json'))).map(b=>b.id),...(JSON.parse(await fs.readFile('historical-books.json'))).map(b=>b.id),'psalms','matthew','mark','luke','john','acts','romans',...(JSON.parse(await fs.readFile('epistles-books.json'))).map(b=>b.id),'revelation'];
const books=await Promise.all(ids.map(async id=>({id,data:JSON.parse(await fs.readFile(`data/${id}.json`))})));
const index=createSearchIndex(books,'ko');assert.equal(index.books.length,34);assert.equal(index.verses.length,16922);
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
console.log('Scripture search: all 34 books and 16922 entries, KRV combined verses, multilingual references, chapter/range lookup, phrase matching, book scope, limits, exact scene targets and translated text verified.');

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
 header.value='요 3:16';header.dispatchEvent(new Event('input'));await new Promise(resolve=>setTimeout(resolve,160));
 assert.equal(get('scripture-results').querySelectorAll().length,1,'Latest typed reference replaces prior results');
 header.value='';header.dispatchEvent(new Event('input'));await Promise.resolve();assert(!get('scripture-search').open);assert.equal(document.activeElement,header,'Clearing keeps typing available');
 header.value='은혜';header.dispatchEvent(new Event('input'));await new Promise(resolve=>setTimeout(resolve,160));
 get('close-header-search').onclick();await Promise.resolve();assert(!get('scripture-search').open);assert.equal(header.value,'');assert.equal(document.activeElement,get('reader'));
}finally{Object.assign(globalThis,globals);}
console.log('Live search: composing input, focus preservation, latest query, empty input and mobile X collapse verified.');
