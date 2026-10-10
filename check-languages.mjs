import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
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
 for(const name of ['languages.js','epistles-catalog.js','pentateuch-catalog.js','epistles-books.json','pentateuch-books.json','psalms-books.json','historical-books.json','psalms-catalog.js','historical-catalog.js','share-data.mjs','release-data.mjs','partial-release.json'])await fs.copyFile(new URL(name,import.meta.url),path.join(root,name));
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
 assert.equal(actualCatalog[lang].books.length,34);
 const closing=actualSelection(new URLSearchParams({book:'leviticus',chapter:'27',verse:'34',lang}));assert.equal(closing.lang,lang);assert(closing.text.trim());
 const psalm=actualSelection(new URLSearchParams({book:'psalms',chapter:'50',verse:'15',lang}));assert.equal(psalm.lang,lang);assert(psalm.text.trim());
}
const greeting=actualSelection(new URLSearchParams({book:'3john',chapter:'1',verse:'15',lang:'en'}));assert.equal(greeting.reference,'3 John 1:14–15');assert.match(greeting.text,/Peace to you/);
const jpRange=actualSelection(new URLSearchParams({book:'numbers',chapter:'15',verse:'5',lang:'ja'}));assert.equal(jpRange.reference,'民数記 15:4–5');assert(jpRange.text.trim());
console.log('All 102 translations, OT final verses, Psalms and edition-specific verse numbering verified.');
