export default async function handler(req,res){
 const file=String(req.query.file||'');
 if(!/^[a-zA-Z0-9_.-]+\.jpg$/.test(file)){res.status(404).end();return;}
 if(!['GET','HEAD'].includes(req.method)){res.status(405).end();return;}
 const upstream=await fetch(`https://vible-images.meetingup-slack-auth.workers.dev/assets/${file}`,{method:req.method});
 res.status(upstream.status);
 for(const key of ['content-type','content-length','etag','access-control-allow-origin','access-control-expose-headers','x-content-type-options']){const value=upstream.headers.get(key);if(value)res.setHeader(key,value);}
 if(upstream.ok){res.setHeader('Cache-Control','public, max-age=86400');res.setHeader('Vercel-CDN-Cache-Control','public, max-age=604800, stale-while-revalidate=86400');}
 else res.setHeader('Cache-Control','no-store');
 res.end(req.method==='HEAD'?undefined:Buffer.from(await upstream.arrayBuffer()));
}
