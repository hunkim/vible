import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.dirname(new URL(import.meta.url).pathname);
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const books=[];
for(const [id,chapters,count,plan] of [['john',21,879,'image-plan.json'],['acts',28,1007,'acts-image-plan.json']]){
 const data=await read(`data/${id}.json`),source=await read(`data/${id}-source.json`);
 assert.equal(data.chapters,chapters);assert.equal(source.chapters.length,chapters);
 assert.equal(data.scenes.length,data.sceneCount);
 assert.deepEqual(data.scenes.map(s=>s.id),Array.from({length:data.sceneCount},(_,i)=>i+1));
 for(const chapter of source.chapters){
  const verses=data.scenes.filter(s=>s.chapter===chapter.chapter).flatMap(s=>s.verses);
  assert.deepEqual(verses,chapter.verses,`${id} chapter ${chapter.chapter}`);
 }
 assert.equal(data.verseCount,count);assert.equal(data.scenes.flatMap(s=>s.verses).length,count);
 const prompts=await read(plan);assert.deepEqual(prompts.images.map(s=>s.image),data.scenes.map(s=>s.image));
 for(const scene of data.scenes){
  assert.equal(path.basename(scene.image),scene.image);
  const bytes=await fs.readFile(path.join(root,'assets',scene.image));
  assert.equal(bytes[0],0xff);assert.equal(bytes[1],0xd8);
 }
 books.push({id,data,plan});
}
// Validate all inputs before replacing a previous successful build.
const output=path.join(root,'dist');
await fs.rm(output,{recursive:true,force:true});
await fs.mkdir(path.join(output,'assets'),{recursive:true});await fs.mkdir(path.join(output,'data'),{recursive:true});
for(const file of ['index.html','app.js','annotations.js','install.js','sw.js','manifest.webmanifest','style.css',...books.flatMap(b=>[b.plan,`data/${b.id}.json`])])await fs.copyFile(path.join(root,file),path.join(output,file));
await fs.cp(path.join(root,'icons'),path.join(output,'icons'),{recursive:true});
for(const {data} of books)for(const scene of data.scenes)await fs.copyFile(path.join(root,'assets',scene.image),path.join(output,'assets',scene.image));
for(const {data} of books)console.log(`Built ${data.book}: ${data.chapters} chapters, ${data.verseCount} unchanged verses, ${data.sceneCount} images.`);
