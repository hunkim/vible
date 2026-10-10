import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const fixture=await fs.mkdtemp(path.join(os.tmpdir(),'vible-release-refresh-'));
try{
 await fs.mkdir(path.join(fixture,'data'));
 for(const name of ['release-data.mjs','share-data.mjs','languages.js','epistles-catalog.js','pentateuch-catalog.js','psalms-catalog.js','proverbs-catalog.js','historical-catalog.js','epistles-books.json','pentateuch-books.json','psalms-books.json','proverbs-books.json','historical-books.json'])await fs.copyFile(new URL(name,import.meta.url),path.join(fixture,name));
 await fs.copyFile(new URL('./data/1corinthians.json',import.meta.url),path.join(fixture,'data/1corinthians.json'));
 await fs.writeFile(path.join(fixture,'package.json'),'{"type":"module"}');
 const releases=path.join(fixture,'partial-release.json');
 await fs.writeFile(releases,JSON.stringify({'1corinthians':51}));
 const {selection}=await import(pathToFileURL(path.join(fixture,'share-data.mjs')).href);
 const params=new URLSearchParams({book:'1corinthians',chapter:'16',verse:'24'});
 const pending=selection(params);assert.equal(pending.image,'image-pending.svg');
 await fs.writeFile(releases,'{}');
 const completed=selection(params);assert.equal(completed.image,'1corinthians-124-right-v1.jpg');
 assert.equal(completed.text,pending.text);assert.equal(completed.reference,pending.reference);
 await fs.writeFile(releases,JSON.stringify({'1corinthians':{count:124,withheld:[124]}}));
 const withheld=selection(params);assert.equal(withheld.image,'image-pending.svg');assert.equal(withheld.text,completed.text);
 await fs.writeFile(releases,'{}');assert.equal(selection(params).image,completed.image);
 console.log('Reviewed images replace pending shared cards without a server restart; Scripture remains identical.');
}finally{await fs.rm(fixture,{recursive:true,force:true});}
