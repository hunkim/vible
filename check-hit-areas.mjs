import assert from 'node:assert/strict';
import fs from 'node:fs';
// Enlarged hit areas (::before/::after with a negative inset) are positioned against their nearest positioned
// ancestor. If the control itself stays static, the overlay stretches across the header and steals clicks from
// neighbouring controls (2026-10-25: the search button's overlay opened search when the book picker was clicked).
const css=fs.readFileSync(new URL('style.css',import.meta.url),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
// Keep only rules that apply at every width; positioning granted inside one @media block does not protect the rest.
let top='',depth=0,inAt=false;
for(let i=0;i<css.length;i++){
 const c=css[i];
 if(depth===0&&c==='@'){inAt=true;}
 if(c==='{'){depth++;if(inAt&&depth===1){continue;}}
 if(c==='}'){depth--;if(inAt&&depth===0){inAt=false;continue;}}
 if(!inAt)top+=c;
}
const rules=[...top.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([,sel,body])=>({sel:sel.trim(),body}));
const expand=sel=>{const m=sel.match(/^(.*?):is\(([^()]*)\)(.*)$/);return m?m[2].split(',').flatMap(part=>expand(m[1]+part.trim()+m[3])):[sel.trim()];};
const selectors=sel=>sel.split(/,(?![^()]*\))/).flatMap(expand);
const target=sel=>sel.replace(/::?(after|before)$/,'').trim().split(/\s+/).pop();
const positioned=new Set(rules.filter(r=>/position:\s*(relative|absolute|fixed|sticky)/.test(r.body)).flatMap(r=>selectors(r.sel)).filter(s=>!/::?(after|before)$/.test(s)).map(target));
const hitAreas=rules.filter(r=>/inset:\s*-/.test(r.body)).flatMap(r=>selectors(r.sel)).filter(s=>/::?(after|before)$/.test(s)).map(target);
assert(hitAreas.includes('#open-search'),'hit-area rules found');
const missing=[...new Set(hitAreas)].filter(t=>!positioned.has(t));
assert.deepEqual(missing,[],`enlarged hit areas need their own control positioned at every width: ${missing.join(', ')}`);
console.log(`Enlarged hit areas: ${new Set(hitAreas).size} header/source controls are positioned at every width, so overlays stay on their own control.`);
