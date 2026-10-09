import fs from 'node:fs';
const releaseFile=new URL('./partial-release.json',import.meta.url);
let cachedVersion='',partial={};
export function releaseVersion(){const stat=fs.statSync(releaseFile);return `${stat.mtimeMs}:${stat.size}`;}
function refresh(){const version=releaseVersion();if(version!==cachedVersion){partial=JSON.parse(fs.readFileSync(releaseFile,'utf8'));cachedVersion=version;}}
export function releaseData(id,data){
 refresh();
 const count=partial[id];if(count===undefined)return data;
 return {...data,partialRelease:{availableImages:count,totalImages:data.scenes.length},scenes:data.scenes.map((s,i)=>i<count?s:{...s,image:'image-pending.svg',imagePending:true})};
}
