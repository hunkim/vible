import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./install.js',import.meta.url),'utf8');
function setup(nav={},standalone=false,overlay=false,storage=new Map()){
 const elements=new Map(),events={},media={matches:standalone,addEventListener(type,fn){this[type]=fn;}};
 const overlayMedia={matches:overlay,addEventListener(type,fn){this[type]=fn;}};
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:id==='install-instructions',disabled:false,open:false,children:[],append(li){this.children.push(li);},addEventListener(type,fn){this[type]=fn;},showModal(){this.open=true;},close(){this.open=false;},focus(){this.focused=true;}});return elements.get(id);};
 vm.runInNewContext(source,{localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},document:{getElementById:el,createElement:()=>({})},navigator:{userAgent:'Chrome',platform:'Linux',...nav},matchMedia:query=>query.includes('window-controls-overlay')?overlayMedia:media,window:{addEventListener:(type,fn)=>events[type]=fn},URLSearchParams,location:{search:'?preview'}});
 assert.equal(el('install-dialog').open,false,'Never show the install dialog automatically');
 return {el,events,media,overlayMedia};
}
const native=setup();let prompted=0,prevented=false;
assert.equal(native.el('install').hidden,false,'Show the header install button in a browser');
native.events.beforeinstallprompt({preventDefault(){prevented=true;},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})});
assert(prevented);assert.equal(native.el('install-now').textContent,'지금 설치하기');assert.equal(native.el('install-dialog').open,false);
await native.el('install').onclick();assert.equal(prompted,1,'Banner click opens the native prompt directly');assert.equal(native.el('install-dialog').open,false);
native.events.appinstalled();assert(native.el('install').hidden);native.el('install').onclick();assert.equal(native.el('install-dialog').open,false);
for(const result of ['dismissed','error']){
 const app=setup();app.events.beforeinstallprompt({preventDefault(){},async prompt(){if(result==='error')throw Error('blocked');},userChoice:Promise.resolve({outcome:'dismissed'})});
 await app.el('install').onclick();assert(app.el('install-dialog').open);assert.equal(app.el('install-instructions').hidden,false);assert.equal(app.el('install-now').disabled,false);
}
const phone=setup({userAgent:'iPhone Safari'});phone.el('install').onclick();assert.equal(phone.el('install-instructions').hidden,false);assert(phone.el('install-now').hidden);assert.match(phone.el('install-steps').children[2].textContent,/홈 화면에 추가/);phone.el('install-later').onclick();assert.equal(phone.el('install-dialog').open,false);
const ipad=setup({userAgent:'Safari',platform:'MacIntel',maxTouchPoints:5});assert.equal(ipad.el('install-now').textContent,'홈 화면에 추가하기');
const safari=setup({userAgent:'Version/26 Safari',platform:'MacIntel'});assert.match(safari.el('install-steps').children[1].textContent,/Dock/);
for(const app of [setup({},true),setup({standalone:true}),setup({},false,true)]){assert(app.el('install').hidden);app.el('install').onclick();assert.equal(app.el('install-dialog').open,false);}
const mode=setup();mode.el('install').onclick();mode.media.matches=true;mode.media.change();assert.equal(mode.el('install-dialog').open,false);assert(mode.el('install').hidden);
console.log('Installation verified: manual opening only, native prompt, cancellation/error fallback, iPhone/iPad/Mac help, installed mode.');

const overlayApp=setup();overlayApp.el('install').onclick();overlayApp.overlayMedia.matches=true;overlayApp.overlayMedia.change();assert(overlayApp.el('install').hidden);assert.equal(overlayApp.el('install-dialog').open,false);

const remembered=new Map();const installedApp=setup({},false,false,remembered);installedApp.events.appinstalled();assert(setup({},false,false,remembered).el('install').hidden);const uninstalled=setup({},false,false,remembered);uninstalled.events.beforeinstallprompt({preventDefault(){}});assert(!uninstalled.el('install').hidden);assert(!remembered.has('vible-installed'));
console.log('Confirmed installation survives reload; a fresh native install prompt clears stale installed state.');
