import assert from 'node:assert/strict';
import {filterBooks,bookPicker} from './book-picker.js';
import {bookNames} from './languages.js';
const books=Object.entries(bookNames.ko).map(([id,name])=>({id,name}));
assert.deepEqual(new Set(filterBooks(books,'요').map(book=>book.id)),new Set(['john','1john','2john','3john','revelation']));
assert.deepEqual(filterBooks(books,'고전').map(book=>book.id),['1corinthians']);
assert.deepEqual(filterBooks(books,'로마').map(book=>book.id),['romans']);
assert.deepEqual(filterBooks(books,'ｊｏｈｎ').map(book=>book.id).sort(),['1john','2john','3john','john']);
assert.equal(filterBooks(books,'없는책123').length,0);assert.equal(filterBooks(books,'').length,books.length);
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
 assert.equal(names().length,5,'Subsequent composing syllables update the list');
 const enter=new Event('keydown',{cancelable:true});Object.assign(enter,{key:'Enter',isComposing:true});input.dispatchEvent(enter);
 assert.equal(enter.defaultPrevented,false,'IME confirmation is not intercepted as book selection');
 input.dispatchEvent(new Event('compositionend'));assert.equal(names().length,5);
 input.value='';input.dispatchEvent(new Event('input'));assert.equal(new Set(names()).size,books.length);
}finally{Object.assign(globalThis,saved);}
console.log('Book picker IME: live Korean composition, confirmation key and clearing verified.');
