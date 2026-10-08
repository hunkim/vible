import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('data/john.json',import.meta.url),'utf8'));
const origin=process.env.VIBLE_ORIGIN || 'http://127.0.0.1:4174/';
for(const file of ['index.html','app.js','style.css','data/john.json',...data.scenes.map(s=>'assets/'+s.image)]){
 const response=await fetch(origin+file,{method:'HEAD'});
 if(response.status!==200)throw Error(`${file}: ${response.status}`);
 if(file.endsWith('.jpg')&&!response.headers.get('content-type').startsWith('image/jpeg'))throw Error(`Wrong content type: ${file}`);
}
console.log('Web app, full John data and all 196 image URLs verified.');
