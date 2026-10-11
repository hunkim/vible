import {isNative} from './platform.js';
// Store apps have no service worker, so recently viewed scene images are kept here instead (same 60-image bound as sw.js).
const NAME='vible-images',LIMIT=60;let shown='';
export const offlineImages=isNative&&typeof caches!=='undefined';
export async function offlineImageURL(url,store=globalThis.caches){
 try{
  const cache=await store.open(NAME);let response=await cache.match(url);
  if(!response){
   response=await fetch(url,{mode:'cors'});if(!response.ok)return url;
   await cache.put(url,response.clone());
   const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-LIMIT)))await cache.delete(key);
  }
  const blobURL=URL.createObjectURL(await response.blob());if(shown)URL.revokeObjectURL(shown);shown=blobURL;return blobURL;
 }catch{return url;}
}
