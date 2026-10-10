import {put,get,list} from '@vercel/blob';
export async function readFeedback(pathname){const result=await get(pathname,{access:'private',useCache:false});if(!result)return null;return JSON.parse(await new Response(result.stream).text());}
export async function writeFeedback(pathname,record){return put(pathname,JSON.stringify(record),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false});}
export async function listFeedback(prefix,cursor,limit=100){return list({prefix,cursor,limit});}
