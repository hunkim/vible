import fs from 'node:fs';
const partial=JSON.parse(fs.readFileSync(new URL('./partial-release.json',import.meta.url),'utf8'));
export function releaseData(id,data){
 const count=partial[id];if(count===undefined)return data;
 return {...data,partialRelease:{availableImages:count,totalImages:data.scenes.length},scenes:data.scenes.map((s,i)=>i<count?s:{...s,image:'image-pending.svg',imagePending:true})};
}
