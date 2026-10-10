import fs from 'node:fs';
const releaseFile=new URL('./partial-release.json',import.meta.url);
let cachedVersion='',partial={};
export function releaseVersion(){const stat=fs.statSync(releaseFile);return `${stat.mtimeMs}:${stat.size}`;}
function refresh(){const version=releaseVersion();if(version!==cachedVersion){partial=JSON.parse(fs.readFileSync(releaseFile,'utf8'));cachedVersion=version;}}
export function releaseData(id,data){
 refresh();
 const config=partial[id];if(config===undefined)return data;
 const count=typeof config==='number'?config:config.count,withheld=new Set(typeof config==='number'?[]:config.withheld||[]);
 const available=data.scenes.filter((s,i)=>i<count&&!withheld.has(s.id)).length;
 return {...data,partialRelease:{availableImages:available,totalImages:data.scenes.length},scenes:data.scenes.map((s,i)=>i<count&&!withheld.has(s.id)?s:{...s,image:'image-pending.svg',imagePending:true})};
}
