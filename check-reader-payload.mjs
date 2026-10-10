import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {releaseData} from './release-data.mjs';
let count=0,before=0,after=0;
for(const file of await fs.readdir('dist/data')){
 if(!file.endsWith('.json')||file.endsWith('-source.json'))continue;
 const published=JSON.parse(await fs.readFile(`dist/data/${file}`,'utf8'));if(!published.scenes)continue;
 const original=releaseData(file.slice(0,-5),JSON.parse(await fs.readFile(`data/${file}`,'utf8')));
 assert.equal(published.sceneCount,original.sceneCount);assert.deepEqual(published.partialRelease,original.partialRelease);
 assert.deepEqual(published.scenes.flatMap(s=>s.verses),original.scenes.flatMap(s=>s.verses));
 for(let i=0;i<published.scenes.length;i++){
  const scene=published.scenes[i];assert.equal(scene.image,original.scenes[i].image);assert.equal(scene.id,original.scenes[i].id);assert.equal(scene.imagePending,original.scenes[i].imagePending);
  for(const key of ['prompt','referenceImages','cast','visual'])assert.equal(key in scene,false);
 }
 before+=Buffer.byteLength(JSON.stringify(original));after+=Buffer.byteLength(JSON.stringify(published));count++;
}
assert.equal(count,35);assert(after<before*.5);
const hosting=JSON.parse(await fs.readFile('asset-hosting.json','utf8'));
const assetOrigin=process.env.VIBLE_ASSET_ORIGIN??hosting.origin;
const html=await fs.readFile('dist/index.html','utf8');
if(assetOrigin)assert.match(html,/rel="preconnect"/);else assert.doesNotMatch(html,/rel="preconnect"/);
console.log(`All ${count} reader books retain Scripture and image availability; payload reduced ${Math.round((1-after/before)*100)}% (${before} to ${after} bytes).`);
