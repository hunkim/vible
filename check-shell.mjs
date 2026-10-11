import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// Every file the service worker pre-caches must exist in the web build, or installation fails for new visitors.
const sw=await fs.readFile(new URL('./dist/sw.js',import.meta.url),'utf8');
const files=[...sw.match(/const FILES=\[(.*?)\];/s)[1].matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]).filter(Boolean);
const missing=[];for(const f of files)try{await fs.access(new URL(`./dist/${f}`,import.meta.url));}catch{missing.push(f);}
assert.deepEqual(missing,[],`service worker pre-cache files missing from dist: ${missing.join(', ')}`);
console.log(`Service worker shell verified: all ${files.length} pre-cached files exist in the web build.`);
