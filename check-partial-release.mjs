import assert from 'node:assert/strict';
import fs from 'node:fs';
import {releaseData} from './release-data.mjs';
const read=file=>JSON.parse(fs.readFileSync(new URL(file,import.meta.url),'utf8'));
const partial=read('./partial-release.json');
const metadata=read('./epistles-books.json');
for(const book of metadata){
 const source=read(`./data/${book.id}.json`),released=releaseData(book.id,source);
 const available=partial[book.id]??source.sceneCount;
 assert(Number.isInteger(available)&&available>=0&&available<=source.sceneCount);
 assert.deepEqual(released.scenes.flatMap(s=>s.verses),source.scenes.flatMap(s=>s.verses));
 assert.equal(released.scenes.filter(s=>!s.imagePending).length,available);
 for(const [index,scene] of released.scenes.entries()){
  assert.equal(scene.image,index<available?source.scenes[index].image:'image-pending.svg');
  assert(fs.existsSync(new URL('./assets/'+scene.image,import.meta.url)));
 }
 if(available===source.sceneCount)assert.equal(released.scenes.filter(s=>s.imagePending).length,0);
}
const john=read('./data/john.json');assert.equal(releaseData('john',john),john);
console.log('All 20 letters preserve every source verse; available images exist and unfinished scenes use explicit placeholders.');
