import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {uiText,text} from './i18n.js';
// Every interface string exists in all four languages, and Korean values match the static page.
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
const keys=Object.keys(uiText.ko);
for(const lang of ['en','ja','zh'])assert.deepEqual(Object.keys(uiText[lang]).sort(),[...keys].sort(),`${lang} interface keys`);
for(const lang of ['ko','en','ja','zh'])for(const [key,value] of Object.entries(uiText[lang])){
 if(typeof value==='function')assert(String(value(3,5)).length>0,`${lang}.${key}`);
 else{assert(value.trim(),`${lang}.${key} empty`);if(lang!=='ko')assert(!/[가-힣]/.test(value),`${lang}.${key} contains Korean`);}
}
const decode=s=>s.replace(/<br>/g,'\n').replace(/&amp;/g,'&');
const used=new Set();
for(const [,attrs,body] of html.matchAll(/<[a-z0-9]+([^>]*\sdata-i18n="[^"]+"[^>]*)>([^<]*(?:<br>[^<]*)*)/g)){
 const key=attrs.match(/data-i18n="([^"]+)"/)[1];used.add(key);
 for(const lang of ['ko','en','ja','zh'])assert.equal(typeof text(lang)[key],'string',`${lang} missing ${key}`);
 assert.equal(decode(body).trim(),text('ko')[key],`index.html text for ${key} differs from Korean copy`);
}
for(const [tag,spec] of html.matchAll(/<[^>]*data-i18n-attr="([^"]+)"[^>]*>/g))for(const pair of spec.split(';')){
 const [attr,key]=pair.split(':');used.add(key);
 for(const lang of ['ko','en','ja','zh'])assert.equal(typeof text(lang)[key],'string',`${lang} missing ${key}`);
 const current=tag.match(new RegExp(`\\s${attr}="([^"]*)"`));
 if(current)assert.equal(current[1],text('ko')[key],`index.html ${attr} for ${key} differs from Korean copy`);
}
assert(used.size>=58,`only ${used.size} interface strings are localized`);
console.log(`Interface text verified: ${keys.length} strings in Korean, English, Japanese and Chinese; ${used.size} page strings follow the reading language.`);
