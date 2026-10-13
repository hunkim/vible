import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('./install.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace(/^export /gm,'');
function setup(nav={},standalone=false,overlay=false,storage=new Map(),isNative=false){
 const elements=new Map(),events={},opened=[],media={matches:standalone,addEventListener(type,fn){this[type]=fn;}};
 const overlayMedia={matches:overlay,addEventListener(type,fn){this[type]=fn;}};
 const el=id=>{if(!elements.has(id))elements.set(id,{hidden:id==='install-instructions',disabled:false,open:false,children:[],append(li){this.children.push(li);},replaceChildren(...items){this.children=items;},addEventListener(type,fn){this[type]=fn;},showModal(){this.open=true;},close(){this.open=false;},focus(){this.focused=true;}});return elements.get(id);};
 vm.runInNewContext(source,{localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},document:{getElementById:el,createElement:()=>({})},navigator:{userAgent:'Chrome',platform:'Linux',...nav},matchMedia:query=>query.includes('window-controls-overlay')?overlayMedia:media,window:{addEventListener:(type,fn)=>events[type]=fn,open:(url,...rest)=>opened.push(url)},URLSearchParams,location:{search:isNative?'':'?preview'},isNative});
 assert.equal(el('install-dialog').open,false,'Never show the install dialog automatically');
 return {el,events,media,overlayMedia,opened};
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
// iPhone, iPad and Mac visitors are sent to the App Store app instead of Home Screen / Dock instructions.
const store='https://apps.apple.com/app/id6821509962';
for(const nav of [{userAgent:'iPhone Safari'},{userAgent:'Safari',platform:'MacIntel',maxTouchPoints:5},{userAgent:'Version/26 Safari',platform:'MacIntel'},{userAgent:'Chrome',platform:'MacIntel'}]){
 const apple=setup(nav);apple.el('install').onclick();assert(apple.el('install-dialog').open);assert.equal(apple.el('install-instructions').hidden,true);assert.equal(apple.el('install-now').hidden,false);assert.equal(apple.el('install-now').textContent,'App Store에서 설치');assert.match(apple.el('install-status').textContent,/App Store/);
 apple.el('install-now').onclick();assert.deepEqual(apple.opened,[store]);apple.el('install-later').onclick();assert.equal(apple.el('install-dialog').open,false);
 apple.events.beforeinstallprompt({preventDefault(){}});assert.equal(apple.el('install-now').textContent,'App Store에서 설치','Apple devices keep the App Store link even when the browser offers installation');
}
const windowsChrome=setup({userAgent:'Chrome',platform:'Win32'});windowsChrome.el('install').onclick();assert.equal(windowsChrome.el('install-instructions').hidden,false);assert(windowsChrome.el('install-now').hidden);
for(const app of [setup({},true),setup({standalone:true}),setup({},false,true)]){assert(app.el('install').hidden);app.el('install').onclick();assert.equal(app.el('install-dialog').open,false);}
const mode=setup();mode.el('install').onclick();mode.media.matches=true;mode.media.change();assert.equal(mode.el('install-dialog').open,false);assert(mode.el('install').hidden);
console.log('Installation verified: manual opening only, native prompt, cancellation/error fallback, App Store link on iPhone/iPad/Mac, installed mode.');

const overlayApp=setup();overlayApp.el('install').onclick();overlayApp.overlayMedia.matches=true;overlayApp.overlayMedia.change();assert(overlayApp.el('install').hidden);assert.equal(overlayApp.el('install-dialog').open,false);

const remembered=new Map();const installedApp=setup({},false,false,remembered);installedApp.events.appinstalled();assert(setup({},false,false,remembered).el('install').hidden);const uninstalled=setup({},false,false,remembered);uninstalled.events.beforeinstallprompt({preventDefault(){}});assert(!uninstalled.el('install').hidden);assert(!remembered.has('vible-installed'));
console.log('Confirmed installation survives reload; a fresh native install prompt clears stale installed state.');

// Store apps never offer browser installation and never register the web service worker.
let registered=false;const app=setup({serviceWorker:{register(){registered=true;return Promise.resolve();}}},false,false,new Map(),true);
assert.equal(app.el('install').hidden,true);assert.equal(app.el('install-dialog').open,false);assert.equal(registered,false);
console.log('Store apps hide installation and skip the service worker.');

const english=(()=>{const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{hidden:false,children:[],replaceChildren(...items){this.children=items;},addEventListener(){},showModal(){},close(){}});return elements.get(id);};
 const context={localStorage:{getItem(){},setItem(){},removeItem(){}},document:{documentElement:{lang:'ko'},getElementById:el,createElement:()=>({})},navigator:{userAgent:'iPhone',platform:'iPhone'},matchMedia:()=>({matches:false,addEventListener(){}}),window:{addEventListener(){}},URLSearchParams,location:{search:'?preview'},isNative:false};
 vm.runInNewContext(source+';globalThis.localizeInstall=localizeInstall;',context);assert.match(el('install-steps').children[0].textContent,/Safari에서/);
 context.document.documentElement.lang='en';context.localizeInstall();return el;})();
assert.equal(english('install-steps').children[0].textContent,'Open vible.now in Safari.');assert.equal(english('install-label').textContent,'Install Vible');assert.equal(english('install-now').textContent,'Get it on the App Store');
console.log('Installation help follows the reading language.');
