import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// Every file the service worker pre-caches must exist in the web build, or installation fails for new visitors.
const sw=await fs.readFile(new URL('./dist/sw.js',import.meta.url),'utf8');
const files=[...sw.match(/const FILES=\[(.*?)\];/s)[1].matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]).filter(Boolean);
const missing=[];for(const f of files)try{await fs.access(new URL(`./dist/${f}`,import.meta.url));}catch{missing.push(f);}
assert.deepEqual(missing,[],`service worker pre-cache files missing from dist: ${missing.join(', ')}`);
console.log(`Service worker shell verified: all ${files.length} pre-cached files exist in the web build.`);
// Vercel rejects the whole deployment when a function's includeFiles is longer than 256 characters.
const vercel=JSON.parse(await fs.readFile(new URL('./vercel.json',import.meta.url),'utf8'));
for(const [pattern,config] of Object.entries(vercel.functions||{}))assert(!config.includeFiles||config.includeFiles.length<=256,`${pattern} includeFiles exceeds Vercel's 256-character limit`);
const included=vercel.functions['api/*.mjs'].includeFiles;for(const file of (await fs.readdir(new URL('./',import.meta.url))).filter(f=>f.endsWith('-books.json')))assert(included.includes('*-books.json')||included.includes(file),`${file} is not bundled with the share functions`);
