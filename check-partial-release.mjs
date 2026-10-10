import assert from 'node:assert/strict';
import fs from 'node:fs';
import {releaseData} from './release-data.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url),'utf8'));
const partial=read('./partial-release.json'),hosting=read('./asset-hosting.json');if(process.env.VIBLE_ASSET_ORIGIN!==undefined)hosting.origin=process.env.VIBLE_ASSET_ORIGIN;
const metadata=[...read('./epistles-books.json'),...read('./pentateuch-books.json'),...read('./psalms-books.json'),...read('./psalms-books.json')];
for(const book of metadata){
 const source=read(`./data/${book.id}.json`),released=releaseData(book.id,source);
 const config=partial[book.id]??source.sceneCount,count=typeof config==='number'?config:config.count,withheld=new Set(typeof config==='number'?[]:config.withheld||[]);
 const available=source.scenes.filter((s,i)=>i<count&&!withheld.has(s.id)).length;
 assert(Number.isInteger(available)&&available>=0&&available<=source.sceneCount);
 assert.deepEqual(released.scenes.flatMap(s=>s.verses),source.scenes.flatMap(s=>s.verses));
 assert.equal(released.scenes.filter(s=>!s.imagePending).length,available);
 for(const [index,scene] of released.scenes.entries()){
  assert.equal(scene.image,index<count&&!withheld.has(scene.id)?source.scenes[index].image:'image-pending.svg');
  assert(hosting.origin&&!scene.imagePending?hosting.files[scene.image]?.sha256:fs.existsSync(new URL('./assets/'+scene.image,import.meta.url)));
 }
 if(available===source.sceneCount)assert.equal(released.scenes.filter(s=>s.imagePending).length,0);
}
const john=read('./data/john.json');assert.equal(releaseData('john',john),john);
console.log('All 20 letters and four Torah books preserve every source verse; available images exist and unfinished scenes use explicit placeholders.');
