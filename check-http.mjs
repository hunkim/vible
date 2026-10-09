import fs from 'node:fs';
const books=['john','acts'].map(id=>({id,data:JSON.parse(fs.readFileSync(new URL(`data/${id}.json`,import.meta.url),'utf8'))}));
const origin=process.env.VIBLE_ORIGIN || 'http://127.0.0.1:4174/';
const files=['index.html','app.js','annotations.js','install.js','sw.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','style.css',...books.flatMap(({id,data})=>[`data/${id}.json`,...data.scenes.map(s=>'assets/'+s.image)])];
let cursor=0;
async function worker(){while(cursor<files.length){const file=files[cursor++];
 const response=await fetch(origin+file,{method:'HEAD'});
 if(response.status!==200)throw Error(`${file}: ${response.status}`);
 if(file.endsWith('.jpg')&&!response.headers.get('content-type')?.startsWith('image/jpeg'))throw Error(`Wrong content type: ${file}`);
}}
await Promise.all(Array.from({length:8},worker));
console.log(`Both books and all ${books.reduce((n,b)=>n+b.data.sceneCount,0)} image URLs verified.`);
