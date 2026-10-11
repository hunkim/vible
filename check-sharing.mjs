import assert from 'node:assert/strict';
import vm from 'node:vm';
import {passageURL} from './languages.js';
import {assetURL} from './assets.js';
import {text} from './i18n.js';
import {readFile} from 'node:fs/promises';
// The web platform adapter runs beside the reader code with the simulated browser globals.
const platformSource=(await readFile(new URL('./platform.js',import.meta.url),'utf8')).replace(/^export /gm,'');
const source=platformSource+(await readFile(new URL('./annotations.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export function','function');
async function setup(nav={},touch=false,sceneVerses=false,language="ko"){
 const elements=new Map(),downloads=[],canvases=[],draws=[];let verseRect={top:400,bottom:430,left:200,right:400,width:200};
 const el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,disabled:false,style:{},setAttribute(name,value){this[name]=value;},getBoundingClientRect(){return id==='reader'?{top:200,bottom:740}:{width:220,height:50};},addEventListener(type,fn){this[type==='close'?'onclose':type]=fn;},showModal(){this.open=true;},close(){this.open=false;},focus(){this.focused=true;},select(){this.selected=true;}});return elements.get(id);};
 const classes=new Set();
 const verse={classList:{toggle(name,on){on?classes.add(name):classes.delete(name);}},dataset:{chapter:'5',verse:'30'},querySelector(){return {textContent:'나는 나의 원대로 하려 하지 않고',getBoundingClientRect:()=>verseRect};},closest(){return {dataset:{id:'1'}};}};
 const ctx={drawImage(...args){draws.push(args);},createLinearGradient(){return {addColorStop(){}};},fillRect(){},fillText(){},measureText(){return {width:10};}};
 el('reader').querySelectorAll=()=>sceneVerses?Array.from({length:4},(_,i)=>({...verse,dataset:{chapter:'5',verse:String(30+i)}})):[verse];
 const document={body:{classList:{add(){}}},getElementById:el,addEventListener(){},fonts:{ready:Promise.resolve()},createElement(tag){return tag==='canvas'?(()=>{const canvas={getContext:()=>ctx,toBlob:fn=>fn(new Blob(['png'],{type:'image/png'}))};canvases.push(canvas);return canvas;})():{click(){downloads.push(this);}};}};
 const api=vm.runInNewContext(source+`\nannotations(()=>({bookId:"john",language:${JSON.stringify(language)},data:{book:"요한복음",scenes:[{id:1,image:"scene.jpg"}]}}));`,{matchMedia:()=>({matches:touch}),passageURL,assetURL,text,document,navigator:nav,localStorage:{getItem:()=>null},window:{innerHeight:800,innerWidth:1280,addEventListener(){}},requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){},Image:class {width=1600;height=900;async decode(){}},File,Blob,URL,setTimeout,clearTimeout});
 el('reader').click({target:{closest:()=>({closest:()=>verse})}});
 assert.equal(el('selection-tools').style.top,'340px');assert.equal(el('selection-tools').style.left,'190px');
 verseRect={top:205,bottom:235,left:2,right:202,width:200};el('reader').scroll();assert.equal(el('selection-tools').style.top,'245px');assert.equal(el('selection-tools').style.left,'12px');
 verseRect={top:900,bottom:930,left:200,right:400,width:200};el('reader').scroll();assert.equal(el('selection-tools').hidden,true);
 verseRect={top:400,bottom:430,left:200,right:400,width:200};el('reader').scroll();assert.equal(el('selection-tools').hidden,false);
 el('share-selection').onclick();assert.equal(el('selection-tools').hidden,true);
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(el('share-card').disabled,false);assert.equal(canvases.at(-1).width,1200);assert.equal(canvases.at(-1).height,675);assert.equal(draws.length,1);
 return {el,downloads,classes,verse,api};
}
const calls=[];let supported=true;
const native=await setup({canShare:p=>supported&&p.files?.[0] instanceof File,share:async p=>calls.push(p)});
await native.el('share-card').onclick();
assert.deepEqual(Object.keys(calls[0]),['files']);assert.equal(calls[0].files[0].type,'image/png');assert.equal(calls[0].files[0].name,'vible-john-5-30.png');
await native.el('share-url-selection').onclick();assert.equal(calls[1].url,'https://vible.now/share/john/5/30');assert.equal(calls[1].files,undefined);assert.equal(calls[1].text,undefined);
supported=false;await native.el('share-card').onclick();assert.equal(native.downloads.length,1);
let copied;const fallback=await setup({clipboard:{writeText:async text=>copied=text}});fallback.el('note-dialog').close();await fallback.el('share-url-selection').onclick();assert.equal(fallback.el('note-dialog').open,true);assert.equal(copied,fallback.el('share-url').value);await new Promise(resolve=>setImmediate(resolve));await fallback.el('share-card').onclick();assert.equal(fallback.downloads.length,1);
const denied=await setup({});await denied.el('copy-link').onclick();assert(denied.el('share-url').selected);
const cancel=await setup({canShare:()=>true,share:async()=>{throw Object.assign(new Error(),{name:'AbortError'});}});const before=cancel.el('note-status').textContent;await cancel.el('share-card').onclick();await cancel.el('share-link').onclick();assert.equal(cancel.downloads.length,0);assert.equal(cancel.el('note-status').textContent,before);
const failed=await setup({canShare:()=>true,share:async()=>{throw new Error('blocked');}});await failed.el('share-card').onclick();assert.match(failed.el('note-status').textContent,/이미지 저장/);await failed.el('share-link').onclick();assert.match(failed.el('note-status').textContent,/URL 복사/);
console.log('Selection toolbar positioning/scroll and sharing verified: actual PNG, verse URL, download/copy fallback, denied clipboard, cancellation and errors.');

const mobile=await setup({},true);assert(mobile.classes.has('is-selected'));
let blocked=false;mobile.el('reader').contextmenu({target:{closest:()=>mobile.verse},preventDefault(){blocked=true;}});assert(blocked);
mobile.el('note-dialog').close();mobile.el('reader').click({target:{closest:()=>({closest:()=>mobile.verse})}});assert(!mobile.classes.has('is-selected'));assert(mobile.el('selection-tools').hidden);
blocked=false;native.el('reader').contextmenu({target:{closest:()=>native.verse},preventDefault(){blocked=true;}});assert(!blocked);
console.log('Touch selection, native menu suppression, deselection and desktop context menu preservation verified.');

const sceneCalls=[];const scene=await setup({share:async payload=>sceneCalls.push(payload)},false,true,'en');
await scene.api.shareScene({chapter:5,first:30,last:33});
assert.equal(sceneCalls[0].url,'https://vible.now/share/john/5/30/5/32?lang=en');
scene.el('note-dialog').close();await scene.api.shareScene({chapter:5,first:33,last:33});
assert.equal(sceneCalls[1].url,'https://vible.now/share/john/5/33?lang=en');assert.equal(scene.el('note-dialog').open,false);
const sceneFallback=await setup({clipboard:{writeText:async text=>copied=text}},false,true);
sceneFallback.el('note-dialog').close();await sceneFallback.api.shareScene({chapter:5,first:30,last:33});
assert.equal(sceneFallback.el('note-dialog').open,true);assert.equal(copied,'https://vible.now/share/john/5/30/5/32');sceneFallback.el('note-dialog').close();sceneFallback.el('note-dialog').onclose();assert.equal(sceneFallback.el('selection-tools').hidden,true);
console.log('Scene sharing verified: maximum three verses, single verse, selected language and clipboard/card fallback.');

// Share cards keep English words whole while Korean, Japanese and Chinese wrap per character.
const wrapSource=(await readFile(new URL('./annotations.js',import.meta.url),'utf8')).match(/const wrapToken=.*\n function wrap[^\n]*/)[0];
const wrapLines=new Function(wrapSource.replace('const wrapToken','var wrapToken')+';return wrap;')(),measure={measureText:t=>({width:[...t].length*10})};
assert.deepEqual(wrapLines(measure,'In the beginning was the Word, and the Word was with God',200),['In the beginning was','the Word, and the','Word was with God']);
assert.deepEqual(wrapLines(measure,'태초에 말씀이 계시니라',100),['태초에 말씀이 계시','니라']);
assert.deepEqual(wrapLines(measure,'太初有道，道与神同在',60),['太初有道，道','与神同在']);
console.log('Share card wrapping keeps English words whole and preserves CJK wrapping.');
