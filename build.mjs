import fs from 'node:fs/promises';
import {constants as fsConstants} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSearchIndex} from './scripture-search.js';
import {releaseData} from './release-data.mjs';
import {applyTranslation,languages} from './languages.js';
const root=path.dirname(new URL(import.meta.url).pathname);
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const hosting=await read('asset-hosting.json');if(process.env.VIBLE_ASSET_ORIGIN!==undefined)hosting.origin=process.env.VIBLE_ASSET_ORIGIN;if(hosting.origin){const origin=new URL(hosting.origin);assert.equal(origin.protocol,'https:');assert.equal(origin.origin,hosting.origin);}
const books=[];
for(const [id,chapters,count,plan] of [['john',21,879,'image-plan.json'],['acts',28,1007,'acts-image-plan.json'],['romans',16,433,'romans-image-plan.json'],['revelation',22,404,'revelation-image-plan.json'],['genesis',50,1533,'genesis-image-plan.json'],['matthew',28,1071,'matthew-image-plan.json'],['mark',16,678,'mark-image-plan.json'],['luke',24,1151,'luke-image-plan.json'],...((await read('epistles-books.json')).map(book=>[book.id,book.chapters,book.verseCount,`${book.id}-image-plan.json`])),...((await read('pentateuch-books.json')).map(book=>[book.id,book.chapters,book.verseCount,`${book.id}-image-plan.json`])),...((await read('psalms-books.json')).map(book=>[book.id,book.chapters,book.verseCount,`${book.id}-image-plan.json`]))]){
 const data=await read(`data/${id}.json`),source=await read(`data/${id}-source.json`);
 assert.equal(data.chapters,chapters);assert.equal(source.chapters.length,chapters);
 assert.equal(data.scenes.length,data.sceneCount);
 assert.deepEqual(data.scenes.map(s=>s.id),Array.from({length:data.sceneCount},(_,i)=>i+1));
 for(const chapter of source.chapters){
  const verses=data.scenes.filter(s=>s.chapter===chapter.chapter).flatMap(s=>s.verses);
  assert.deepEqual(id==='deuteronomy'?verses.map(({omitted,combinedWith,endVerse,...original})=>original):verses,chapter.verses,`${id} chapter ${chapter.chapter}`);
 }
 assert.equal(data.verseCount,count);assert.equal(data.scenes.flatMap(s=>s.verses).length,count);
 const prompts=await read(plan);assert.deepEqual(prompts.images.map(s=>s.image),data.scenes.map(s=>s.image));
 for(const scene of data.scenes){
  assert.equal(path.basename(scene.image),scene.image);
  if(releaseData(id,data).scenes[scene.id-1].imagePending)continue;
  if(hosting.origin){
   const uploaded=hosting.files[scene.image];assert(/^[a-f0-9]{64}$/.test(uploaded?.sha256||''),`${scene.image} must be uploaded to R2 before release`);
   try{const bytes=await fs.readFile(path.join(root,'assets',scene.image));assert.equal(createHash('sha256').update(bytes).digest('hex'),uploaded.sha256,`${scene.image} changed since R2 upload; upload it before release`);}catch(error){if(error.code!=='ENOENT')throw error;}
   continue;
  }
  const bytes=await fs.readFile(path.join(root,'assets',scene.image));
  assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
 }
 books.push({id,data:releaseData(id,data),plan});
}
const catalog=Object.fromEntries(languages.map(lang=>[lang,{books:[],licensedBooks:[]}]));
for(const {id,data} of books){
 catalog.ko.books.push(id);
 for(const lang of languages){
  const file=path.join(root,`data/translations/${lang}/${id}.json`);
  try{await fs.access(file);}catch{continue;}
  applyTranslation(data,JSON.parse(await fs.readFile(file,'utf8')),lang);
  if(lang!=='ko')catalog[lang].books.push(id);catalog[lang].licensedBooks.push(id);
 }
}
// Validate all inputs before replacing a previous successful build.
const output=path.join(root,'dist');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(path.join(output,'assets'),{recursive:true});await fs.mkdir(path.join(output,'data'),{recursive:true});
for(const file of ['index.html','assets.js','feedback.js','app.js','annotations.js','install.js','sw.js','manifest.webmanifest','style.css','share.css','share.js','languages.js','epistles-catalog.js','pentateuch-catalog.js','psalms-catalog.js','scripture-search.js','search-ui.js','book-picker.js','jesus-words.js','jesus-words-data.js',...books.flatMap(b=>[b.plan,`data/${b.id}.json`])])await fs.copyFile(path.join(root,file),path.join(output,file));
for(const file of ['assets.js','sw.js']){const source=await fs.readFile(path.join(root,file),'utf8');await fs.writeFile(path.join(output,file),source.replace("const ASSET_ORIGIN=''",`const ASSET_ORIGIN=${JSON.stringify(hosting.origin)}`));}
await fs.cp(path.join(root,'icons'),path.join(output,'icons'),{recursive:true});
await fs.cp(path.join(root,'data/translations'),path.join(output,'data/translations'),{recursive:true});
await fs.writeFile(path.join(root,'data/translations/catalog.json'),JSON.stringify(catalog,null,2));
await fs.writeFile(path.join(output,'data/translations/catalog.json'),JSON.stringify(catalog));
await fs.cp(path.join(root,'fonts'),path.join(output,'fonts'),{recursive:true});
// Keep production readers lean; generation prompts and reference metadata stay in source.
for(const {id,data} of books){const reader={...data,scenes:data.scenes.map(({prompt,referenceImages,cast,visual,...scene})=>scene)};await fs.writeFile(path.join(output,`data/${id}.json`),JSON.stringify(reader));}
if(hosting.origin){const file=path.join(output,'index.html');const html=await fs.readFile(file,'utf8');await fs.writeFile(file,html.replace('</head>',`<link rel="preconnect" href="${hosting.origin}" crossorigin><link rel="dns-prefetch" href="${hosting.origin}"></head>`));}
// Reuse storage on copy-on-write filesystems; unsupported systems fall back to ordinary copies.
for(const {data} of books)for(const scene of data.scenes)if(!hosting.origin||scene.imagePending)await fs.copyFile(path.join(root,'assets',scene.image),path.join(output,'assets',scene.image),fsConstants.COPYFILE_FICLONE);
for(const {data} of books)console.log(`Built ${data.book}: ${data.chapters} chapters, ${data.verseCount} unchanged verses, ${data.partialRelease?`${data.partialRelease.availableImages}/${data.sceneCount} images available`:data.sceneCount+' images'}.`);

await fs.mkdir(path.join(output,'data/search'),{recursive:true});
for(const lang of languages){
 const translated=[];
 for(const {id,data} of books){
  if(!catalog[lang].books.includes(id))continue;
  translated.push({id,data:catalog[lang].licensedBooks.includes(id)?applyTranslation(data,await read(`data/translations/${lang}/${id}.json`),lang):data});
 }
 await fs.writeFile(path.join(output,`data/search/${lang}.json`),JSON.stringify(createSearchIndex(translated,lang)));
}
