import assert from 'node:assert/strict';
import {cardResponse} from './api/share-card.mjs';
import {selection} from './share-data.mjs';
const passage=selection(new URLSearchParams({book:'john',chapter:'3',verse:'16',lang:'en'}));
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async()=>{throw Error('Pending artwork must not depend on a public image request.');};
 const response=await cardResponse({...passage,image:'image-pending.svg'});
 const png=Buffer.from(await response.arrayBuffer());
 assert.equal(response.status,200);
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.equal(png.readUInt32BE(16),1200);
 assert(png.readUInt32BE(20)>=675);
}finally{globalThis.fetch=originalFetch;}
console.log('Unfinished-art shared cards render a real 1200px PNG without public image fetches.');
