import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.dirname(new URL(import.meta.url).pathname),out=path.join(root,'dist-native');
execFileSync(process.execPath,['build.mjs','--target=native'],{cwd:root,stdio:'ignore'});
const exists=async file=>fs.access(path.join(out,file)).then(()=>true,()=>false);

// Bundle: the web reader without browser-install pieces, with every book and language offline.
for(const file of ['sw.js','manifest.webmanifest'])assert.equal(await exists(file),false,`${file} must not ship in store apps`);
assert.deepEqual((await fs.readdir(out)).filter(f=>f.endsWith('-image-plan.json')),[],'prompt plans stay on vible.now');
const html=await fs.readFile(path.join(out,'index.html'),'utf8');assert(!html.includes('manifest.webmanifest'));assert(html.includes('src="app.js"'));
for(const file of ['platform.js','app.js','assets.js','assets/image-pending.svg','data/translations/catalog.json'])assert(await exists(file),file);
assert.match(await fs.readFile(path.join(out,'assets.js'),'utf8'),/ASSET_ORIGIN="https:\/\/images\.vible\.now"/);
const catalog=JSON.parse(await fs.readFile(path.join(out,'data/translations/catalog.json'),'utf8'));
for(const id of catalog.ko.books)assert(await exists(`data/${id}.json`),id);
for(const lang of ['en','ja','zh'])for(const id of catalog[lang].licensedBooks)assert(await exists(`data/translations/${lang}/${id}.json`),`${lang}/${id}`);
for(const lang of ['ko','en','ja','zh'])assert(await exists(`data/search/${lang}.json`),`search ${lang}`);
let bytes=0;for(const entry of await fs.readdir(out,{recursive:true,withFileTypes:true}))if(entry.isFile())bytes+=(await fs.stat(path.join(entry.parentPath,entry.name))).size;
assert(bytes<100e6,`bundle ${bytes} bytes exceeds 100 MB budget`);

// Adapter: Capacitor share sheet and Tauri save dialog; the web path is covered by check-sharing.mjs.
const source=(await fs.readFile(path.join(root,'platform.js'),'utf8')).replace(/^export /gm,'')+'\n;({platform,isNative,apiURL,shareLink,shareFile,saveFile,canShareLink,openExternal,appLinkTarget,handleBack})';
const listeners={},document={addEventListener:(type,fn)=>listeners[type]=fn};
const calls=[];let cancel=false;
const Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',nativePromise:async(plugin,method,options)=>{calls.push(JSON.parse(JSON.stringify([plugin,method,options])));if(cancel&&plugin==='Share')throw Error('Share canceled');return plugin==='Filesystem'?{uri:'file:///cache/'+options.path}:{};}};
class FileReader{readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:image/png;base64,'+Buffer.from(b).toString('base64');this.onload();});}}
const mobile=vm.runInNewContext(source,{Capacitor,document,navigator:{},FileReader,location:{href:'capacitor://localhost/index.html'},URL,URLSearchParams});
assert.equal(mobile.platform,'ios');assert.equal(mobile.isNative,true);assert.equal(mobile.apiURL('/api/feedback'),'https://vible.now/api/feedback');assert(mobile.canShareLink());
assert.equal(await mobile.shareLink({title:'요 3:16 · Vible',url:'https://vible.now/share/john/3/16'}),true);
assert.deepEqual(calls.at(-1),['Share','share',{title:'요 3:16 · Vible',url:'https://vible.now/share/john/3/16',dialogTitle:'요 3:16 · Vible'}]);
const card=new File([new Uint8Array([137,80,78,71])],'vible-john-3-16.png',{type:'image/png'});
assert.equal(await mobile.shareFile(card),true);
assert.deepEqual(calls.at(-2),['Filesystem','writeFile',{path:'vible-john-3-16.png',data:'iVBORw==',directory:'CACHE'}]);
assert.deepEqual(calls.at(-1),['Share','share',{files:['file:///cache/vible-john-3-16.png']}]);
cancel=true;await assert.rejects(mobile.shareLink({title:'t',url:'https://vible.now/'}),{name:'AbortError'});cancel=false;
let prevented=false;listeners.click({target:{closest:()=>({href:'https://creativecommons.org/licenses/by-sa/4.0/',hasAttribute:()=>false})},preventDefault(){prevented=true;}});
assert(prevented);assert.deepEqual(calls.at(-1),['Browser','open',{url:'https://creativecommons.org/licenses/by-sa/4.0/'}]);
prevented=false;listeners.click({target:{closest:()=>({href:'capacitor://localhost/index.html?book=ruth',hasAttribute:()=>false})},preventDefault(){prevented=true;}});assert(!prevented,'in-app links stay in the reader');

const written=[],opened=[];let target='/Users/me/Desktop/card.png';
const __TAURI__={dialog:{save:async options=>{written.push(['dialog',options.defaultPath]);return target;}},fs:{writeFile:async(file,data)=>written.push([file,data.length])},opener:{openUrl:async url=>opened.push(url)}};
const desktop=vm.runInNewContext(source,{__TAURI__,document:{addEventListener(){}},navigator:{share(){throw Error('desktop webviews must not use navigator.share');}},location:{href:'tauri://localhost/'},URL,Uint8Array});
assert.equal(desktop.platform,'desktop');assert.equal(desktop.canShareLink(),false);
assert.equal(await desktop.shareLink({title:'t',url:'https://vible.now/'}),false,'desktop falls back to URL copy');
assert.equal(await desktop.shareFile(card),false,'desktop falls back to saving the card');
await desktop.saveFile(card,'blob:x');assert.deepEqual(written,[['dialog','vible-john-3-16.png'],['/Users/me/Desktop/card.png',4]]);
target=null;await assert.rejects(desktop.saveFile(card,'blob:x'),{name:'AbortError'});
await desktop.openExternal('https://vible.now/');assert.deepEqual(opened,['https://vible.now/']);
// App links: shared verse pages and reader links open the bundled reader at the same passage and language.
assert.equal(mobile.appLinkTarget('https://vible.now/share/john/3/16?lang=en'),'index.html?lang=en&book=john&chapter=3&verse=16&read=1');
assert.equal(mobile.appLinkTarget('https://vible.now/share/1corinthians/13/4/13/7'),'index.html?book=1corinthians&chapter=13&verse=4&read=1');
assert.equal(mobile.appLinkTarget('https://vible.now/?book=ruth&chapter=1&verse=16&lang=ja'),'index.html?book=ruth&chapter=1&verse=16&lang=ja&read=1');
for(const other of ['https://vible.now/','https://vible.now/admin_feedback','https://evil.example/share/john/3/16','not a url'])assert.equal(mobile.appLinkTarget(other),null,other);
const appListeners={};const replaced=[];
const sessionData=new Map(),session={getItem:k=>sessionData.has(k)?sessionData.get(k):null,setItem:(k,v)=>sessionData.set(k,v)};
vm.runInNewContext(source,{Capacitor:{...Capacitor,addListener:(plugin,event,fn)=>appListeners[plugin+'.'+event]=fn,nativePromise:async(plugin,method)=>plugin==='App'&&method==='getLaunchUrl'?{url:'https://vible.now/share/acts/16/31'}:{}},document,navigator:{},location:{href:'capacitor://localhost/index.html',search:'',replace:url=>replaced.push(url)},URL,URLSearchParams,sessionStorage:session});
await new Promise(r=>setImmediate(r));assert.deepEqual(replaced,['index.html?book=acts&chapter=16&verse=31&read=1'],'cold-start link opens its passage');
appListeners['App.appUrlOpen']({url:'https://vible.now/share/john/3/16?lang=en'});assert.equal(replaced.at(-1),'index.html?lang=en&book=john&chapter=3&verse=16&read=1');
// After that reload the same launch URL must not send the reader back to the first passage.
vm.runInNewContext(source,{Capacitor:{...Capacitor,addListener:(plugin,event,fn)=>appListeners[plugin+'.'+event]=fn,nativePromise:async(plugin,method)=>plugin==='App'&&method==='getLaunchUrl'?{url:'https://vible.now/share/acts/16/31'}:{}},document,navigator:{},location:{href:'capacitor://localhost/index.html',search:'',replace:url=>replaced.push(url)},URL,URLSearchParams,sessionStorage:session});
await new Promise(r=>setImmediate(r));assert.equal(replaced.length,2,'launch link is followed once per app session');
// Android back: innermost layer first, then views, then the app goes to the background.
const layers=({dialog=false,popover=false,selection=false,image=false,otherView=false}={})=>{const clicked=[];const el=id=>({hidden:id==='selection-tools'?!selection:id==='reading-view'?otherView:false,click:()=>clicked.push(id)});
 const doc={getElementById:el,querySelectorAll:()=>dialog?[{requestClose:()=>clicked.push('requestClose')}]:[],querySelector:()=>popover?{hidePopover:()=>clicked.push('hidePopover')}:null,body:{classList:{contains:()=>image}}};return {doc,clicked};};
for(const [state,expected,action] of [[{dialog:true,popover:true},'dialog','requestClose'],[{popover:true,selection:true},'popover','hidePopover'],[{selection:true},'selection','dismiss-selection'],[{image:true},'image','focus'],[{otherView:true},'view','read-tab']]){const {doc,clicked}=layers(state);assert.equal(mobile.handleBack(doc),expected);assert.deepEqual(clicked,[action]);}
assert.equal(mobile.handleBack(layers().doc),'minimize');assert.deepEqual(calls.at(-1),['App','minimizeApp',{}]);
console.log(`Store app bundle verified (${(bytes/1e6).toFixed(1)} MB, ${catalog.ko.books.length} books, 4 languages, no service worker); Capacitor share/files/links/app links, Android back and Tauri save/open verified.`);
