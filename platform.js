// Web behaviour stays unchanged; store apps (Capacitor on iOS/Android, Tauri on macOS/Windows) add native services here.
const capacitor=globalThis.Capacitor?.isNativePlatform?.()?globalThis.Capacitor:null;
const tauri=globalThis.__TAURI__||null;
export const platform=capacitor?capacitor.getPlatform():tauri?'desktop':'web';
export const isNative=platform!=='web';
export const SITE_ORIGIN='https://vible.now';
// Bundled apps run from a local origin, so server endpoints live on the production site.
export const apiURL=path=>isNative?SITE_ORIGIN+path:path;
const plugin=(name,method,options)=>capacitor.nativePromise(name,method,options);
function base64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
async function cacheFile(file){const {uri}=await plugin('Filesystem','writeFile',{path:file.name,data:await base64(file),directory:'CACHE'});return uri;}
const aborted=()=>Object.assign(Error('Share canceled'),{name:'AbortError'});
async function nativeShare(options){try{await plugin('Share','share',options);}catch(e){if(/cancel/i.test(e?.message||''))throw aborted();throw e;}}
// Returns false when the platform has no share sheet so callers keep their copy/save fallbacks.
export async function shareLink({title,url}){
 if(capacitor){await nativeShare({title,url,dialogTitle:title});return true;}
 if(navigator.share&&!tauri){await navigator.share({title,url});return true;}
 return false;
}
export async function shareFile(file){
 if(capacitor){await nativeShare({files:[await cacheFile(file)]});return true;}
 const payload={files:[file]};
 if(!tauri&&navigator.share&&navigator.canShare?.(payload)){await navigator.share(payload);return true;}
 return false;
}
export const canShareLink=()=>Boolean(capacitor||(navigator.share&&!tauri));
// Desktop webviews ignore <a download>, so the app asks where to save the card.
export async function saveFile(file,url){
 if(tauri){const target=await tauri.dialog.save({defaultPath:file.name,filters:[{name:'PNG',extensions:['png']}]});if(!target)throw aborted();await tauri.fs.writeFile(target,new Uint8Array(await file.arrayBuffer()));return;}
 if(capacitor){await nativeShare({files:[await cacheFile(file)]});return;}
 const a=document.createElement('a');a.href=url;a.download=file.name;a.click();
}
export function openExternal(url){
 if(tauri)return tauri.opener.openUrl(url);
 if(capacitor)return plugin('Browser','open',{url});
 window.open(url,'_blank','noopener');
}
// Keep links to other sites out of the app webview (custom app schemes have an opaque origin, so compare scheme and host).
if(isNative)document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a||a.hasAttribute('download'))return;const url=new URL(a.href,location.href),here=new URL(location.href);if(url.protocol===here.protocol&&url.host===here.host)return;e.preventDefault();openExternal(url.href);});
// vible.now links (Universal Links / App Links) open the same passage in the bundled reader.
export function appLinkTarget(link){
 let url;try{url=new URL(link);}catch{return null;}
 if(url.hostname!=='vible.now'&&url.hostname!=='www.vible.now')return null;
 const params=new URLSearchParams(url.search),share=url.pathname.match(/^\/share\/([a-z0-9]+)\/(\d+)\/(\d+)(?:\/\d+\/\d+)?\/?$/);
 if(share){params.set('book',share[1]);params.set('chapter',share[2]);params.set('verse',share[3]);}
 if(!params.get('book'))return null;
 params.set('read','1');return `index.html?${params}`;
}
function openAppLink(link){const target=appLinkTarget(link);if(target&&new URL(target,location.href).search!==location.search)location.replace(target);}
if(capacitor){capacitor.addListener?.('App','appUrlOpen',event=>openAppLink(event.url));plugin('App','getLaunchUrl',{}).then(result=>{
 // The launch URL stays the same for the whole process, so follow it only once; later links arrive as appUrlOpen.
 let seen;try{seen=sessionStorage.getItem('vible-launch-url');sessionStorage.setItem('vible-launch-url',result?.url||'');}catch{}
 if(result?.url&&seen===null)openAppLink(result.url);
},()=>{});}
// Android back closes the innermost open layer before leaving the app, as Android users expect.
export function handleBack(doc=document){
 const $=id=>doc.getElementById(id),dialog=[...doc.querySelectorAll('dialog[open]')].at(-1);
 if(dialog){dialog.requestClose?dialog.requestClose():dialog.close();return 'dialog';}
 let popover=null;try{popover=doc.querySelector(':popover-open');}catch{}
 if(popover){popover.hidePopover();return 'popover';}
 if($('selection-tools')&&!$('selection-tools').hidden){$('dismiss-selection').click();return 'selection';}
 if(doc.body.classList.contains('image-only')){$('focus').click();return 'image';}
 if($('reading-view')?.hidden){$('read-tab').click();return 'view';}
 if(capacitor)plugin('App','minimizeApp',{}).catch(()=>{});return 'minimize';
}
if(capacitor?.getPlatform()==='android')capacitor.addListener?.('App','backButton',()=>handleBack());
