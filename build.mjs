import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.dirname(new URL(import.meta.url).pathname);
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const data=await read('data/john.json');
const source=await read('data/john-source.json');
assert.equal(data.scenes.length,196);
assert.deepEqual(data.scenes.map(s=>s.id),Array.from({length:196},(_,i)=>i+1));
for(const chapter of source.chapters){
 const verses=data.scenes.filter(s=>s.chapter===chapter.chapter).flatMap(s=>s.verses);
 assert.deepEqual(verses,chapter.verses);
}
assert.equal(data.scenes.flatMap(s=>s.verses).length,879);
const output=path.join(root,'dist');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(path.join(output,'assets'),{recursive:true});
await fs.mkdir(path.join(output,'data'),{recursive:true});
for(const file of ['index.html','app.js','style.css','image-plan.json','data/john.json']){
 await fs.copyFile(path.join(root,file),path.join(output,file));
}
for(const scene of data.scenes){
 assert.equal(path.basename(scene.image),scene.image);
 const file='assets/'+scene.image;
 const bytes=await fs.readFile(path.join(root,file));
 assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
 await fs.copyFile(path.join(root,file),path.join(output,file));
}
console.log('Built Vible: 21 chapters, 879 unchanged verses, 196 images in dist/.');

