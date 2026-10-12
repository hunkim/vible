import {isNative} from './platform.js';
// Store apps have no service worker, so recently viewed scene images are kept here instead (same 60-image bound as sw.js).
// Scenes display straight from the network; the cache is filled after a load and only read when the network fails.
const NAME='vible-images',LIMIT=60;let shown='';
export const offlineImages=isNative&&typeof caches!=='undefined';
export async function keepOffline(url,store=globalThis.caches){
 try{
  const cache=await store.open(NAME);if(await cache.match(url))return;
  const response=await fetch(url,{mode:'cors'});if(!response.ok)return;
  await cache.put(url,response);
  const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-LIMIT)))await cache.delete(key);
 }catch{}
}
export async function cachedImageURL(url,store=globalThis.caches){
 try{
  const response=await (await store.open(NAME)).match(url);if(!response)return null;
  const blobURL=URL.createObjectURL(await response.blob());if(shown)URL.revokeObjectURL(shown);shown=blobURL;return blobURL;
 }catch{return null;}
}
