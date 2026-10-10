const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Expose-Headers':'ETag, Content-Length'};
export default {async fetch(request,env,context){
 const url=new URL(request.url);
 if(!/^\/assets\/[a-zA-Z0-9_.-]+\.jpg$/.test(url.pathname))return new Response('Not found',{status:404});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Max-Age':'86400'}});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD, OPTIONS'}});
 const cacheKey=new Request(url.origin+url.pathname);const cache=caches.default;
 const cached=await cache.match(cacheKey);
 if(cached){if(request.headers.get('If-None-Match')===cached.headers.get('ETag'))return new Response(null,{status:304,headers:cached.headers});return request.method==='HEAD'?new Response(null,{headers:cached.headers}):cached;}
 const key=url.pathname.slice(1);const object=request.method==='HEAD'?await env.IMAGES.head(key):await env.IMAGES.get(key);
 if(!object)return new Response('Not found',{status:404,headers:cors});
 const headers=new Headers(cors);object.writeHttpMetadata(headers);headers.set('Content-Type','image/jpeg');headers.set('ETag',object.httpEtag);headers.set('Content-Length',String(object.size));headers.set('X-Content-Type-Options','nosniff');headers.set('Cache-Control','public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');headers.set('Vercel-Cache-Tag','vible-images');
 if(request.headers.get('If-None-Match')===object.httpEtag)return new Response(null,{status:304,headers});
 const response=new Response(request.method==='HEAD'?null:object.body,{headers});if(request.method==='GET')context.waitUntil(cache.put(cacheKey,response.clone()));return response;
}};
