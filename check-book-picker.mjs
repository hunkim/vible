import assert from 'node:assert/strict';
import {filterBooks,bookPicker,chapterQuery} from './book-picker.js';
import {bookNames} from './languages.js';
import {bibleBooks} from './bible-books.js';
import fs from 'node:fs';
const books=Object.entries(bookNames.ko).map(([id,name])=>({id,name}));
assert.deepEqual(new Set(filterBooks(books,'요').map(book=>book.id)),new Set(['john','1john','2john','3john','revelation','joel','jonah']));
for(const lang of ['ko','en','ja','zh'])assert.equal(Object.keys(bookNames[lang]).length,66,`${lang}: all 66 book names are bundled for coming-soon listing`);
assert.deepEqual(filterBooks(books,'고전').map(book=>book.id),['1corinthians']);
assert.deepEqual(filterBooks(books,'로마').map(book=>book.id),['romans']);
assert.deepEqual(filterBooks(books,'ｊｏｈｎ').map(book=>book.id).sort(),['1john','2john','3john','john']);
assert.equal(filterBooks(books,'없는책123').length,0);assert.equal(filterBooks(books,'').length,books.length);
// Search box jumps: book abbreviations or names in any language plus a chapter (and optional verse).
for(const [query,id,chapter,verse] of [['창 12','genesis',12,null],['창세기12','genesis',12,null],['시편 119편','psalms',119,null],['Gen 12','genesis',12,null],['요 3:16','john',3,16],['John 3:16','john',3,16],['ヨハネ 3','john',3,null],['约翰福音 3','john',3,null]]){const jump=chapterQuery(books,query);assert(jump,query);assert.deepEqual([jump.book.id,jump.chapter,jump.verse],[id,chapter,verse],query);}
console.log('Book picker chapters: tap-to-expand grid, resume and chapter 1 start, collapse, search jumps in four languages.');
for(const query of ['창 99','요 22','사랑','12','',' 3'])assert.equal(chapterQuery(books,query),null,`no jump for ${query}`);
console.log('Book picker: Korean prefixes, aliases, multilingual names, full-width typing, empty query and no-match state verified.');

// Exercise the real input handlers while the Korean IME still owns the text.
class Element extends EventTarget {
 constructor(){super();this.children=[];this.value='';this.style={};}
 append(...children){this.children.push(...children);}
 replaceChildren(){this.children=[];}
 setAttribute(){}
 querySelectorAll(){return this.children.flatMap(child=>child.tag==='button'?[child]:child.querySelectorAll());}
}
const ids=Object.fromEntries(['book','open-book','book-picker-dialog','book-query','book-results','close-book-picker','selected-book-name'].map(id=>[id,new Element()]));
ids.book.options=books.map(book=>({value:book.id,textContent:book.name}));
const saved={document:globalThis.document,window:globalThis.window,MutationObserver:globalThis.MutationObserver};
try{
 globalThis.document={getElementById:id=>ids[id],createElement:tag=>Object.assign(new Element(),{tag})};
 globalThis.window={addEventListener(){}};
 globalThis.MutationObserver=class{observe(){}};
 const picker=bookPicker(()=>({bookId:'romans',language:'ko'}));picker.localize();assert.equal(ids['selected-book-name'].textContent,'로마서','Direct book links show the active book before the select is synchronized');
 const input=ids['book-query'],names=()=>ids['book-results'].querySelectorAll().map(button=>button.textContent);
 input.dispatchEvent(new Event('compositionstart'));
 input.value='로';input.dispatchEvent(new Event('input'));
 assert.deepEqual(names(),filterBooks(books,'로').map(book=>book.name),'Filter updates before compositionend or a space');
 assert(names().includes('로마서'));
 input.value='요';input.dispatchEvent(new Event('input'));
 assert.equal(names().length,7,'Subsequent composing syllables update the list');
 const enter=new Event('keydown',{cancelable:true});Object.assign(enter,{key:'Enter',isComposing:true});input.dispatchEvent(enter);
 assert.equal(enter.defaultPrevented,false,'IME confirmation is not intercepted as book selection');
 input.dispatchEvent(new Event('compositionend'));assert.equal(names().length,7);
 input.value='';input.dispatchEvent(new Event('input'));assert.equal(new Set(names()).size,books.length);
 // All 66 books are released; a fixture option (not a real book id) keeps the coming-soon path covered for future catalogs.
 ids.book.options.push({value:'fixture-unreleased',textContent:'준비중테스트',disabled:true});input.value='준비중테스트';input.dispatchEvent(new Event('input'));
 const soon=ids['book-results'].querySelectorAll().find(button=>button.textContent==='준비중테스트');assert(soon.disabled&&soon.className==='book-soon'&&soon.children[0].textContent==='준비 중'&&!soon.onclick,'Unreleased books are listed as coming soon and cannot be opened');
 ids.book.options.pop();
 // Tapping a book expands its chapter numbers under it (touch/narrow layout); a number or the resume button opens that chapter.
 const opened=[];bookPicker(()=>({bookId:'romans',language:'ko'}),{openChapter:(id,chapter,verse)=>opened.push([id,chapter,verse]),lastChapter:id=>id==='psalms'?23:null});
 ids['book-picker-dialog'].close=()=>{};input.value='';input.dispatchEvent(new Event('input'));
 ids['book-results'].querySelectorAll().find(button=>button.textContent==='시편').onclick();
 const all=ids['book-results'].querySelectorAll(),resume=all.find(button=>button.className==='chapter-resume'),numbers=all.filter(button=>/^\d+$/.test(button.textContent));
 assert.equal(resume.textContent,'이어 읽기 · 23장 →');assert.equal(numbers.length,150,'Psalms shows all 150 chapters');assert.equal(numbers[22].className,'chapter-current');
 numbers[118].onclick();resume.onclick();assert.deepEqual(opened,[['psalms',119,null],['psalms',23,null]]);
 ids['book-results'].querySelectorAll().find(button=>button.textContent==='시편').onclick();assert(!ids['book-results'].querySelectorAll().some(button=>button.className==='chapter-resume'),'Tapping the book again collapses its chapters');
 ids['book-results'].querySelectorAll().find(button=>button.textContent==='룻기').onclick();assert(!ids['book-results'].querySelectorAll().some(button=>button.className==='chapter-resume'),'Unread books show only the chapter numbers');ids['book-results'].querySelectorAll().find(button=>button.className==='chapter-panel-title').onclick();assert.deepEqual(opened.at(-1),['ruth',1,null],'The book name in the panel opens chapter 1');
 input.value='시 23';input.dispatchEvent(new Event('input'));const jump=ids['book-results'].querySelectorAll().find(button=>button.className==='chapter-jump-result');assert.equal(jump.textContent,'시편 23장 →');jump.onclick();assert.deepEqual(opened.at(-1),['psalms',23,null]);
}finally{Object.assign(globalThis,saved);}
console.log('Book picker IME: live Korean composition, confirmation key and clearing verified.');
// All 66 books are released in every language: the bundled picker lists them in canon order and none falls back to coming soon.
const canon=bibleBooks.map(book=>book.id),released=JSON.parse(fs.readFileSync(new URL('./data/translations/catalog.json',import.meta.url),'utf8'));
for(const lang of ['ko','en','ja','zh'])assert.deepEqual(new Set(released[lang].books),new Set(canon),`${lang}: every book released`);
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'),select=html.slice(html.indexOf('<select id="book"'),html.indexOf('</select>',html.indexOf('<select id="book"')));
assert.deepEqual([...select.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]),canon,'Bundled book options follow canon order');
console.log('Book picker: all 66 books released in four languages and bundled in canon order; coming soon verified with a fixture.');
