import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {releaseData} from './release-data.mjs';
import share from './api/share.mjs';
import shareCard from './api/share-card.mjs';
import feedback from './api/feedback.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4174);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res) => {
 try {
  const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);
  if(pathname.startsWith('/share/')||pathname==='/api/share'||(pathname==='/'&&url.searchParams.has('chapter')&&url.searchParams.has('verse')&&!url.searchParams.has('read')))return share(req,res);
  if(pathname==='/api/feedback')return await feedback(req,res);
  if(pathname==='/api/share-card')return await shareCard(req,res);
  if(/^\/data\/[a-z0-9]+\.json$/.test(pathname)){const id=path.basename(pathname,'.json');const file=path.join(root,'data',id+'.json');if(!fs.existsSync(file)){res.writeHead(404);return res.end('Not found');}const data=releaseData(id,JSON.parse(fs.readFileSync(file,'utf8')));res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-cache'});return res.end(req.method==='HEAD'?'':JSON.stringify(data));}
  const staticRoot=pathname.startsWith('/data/search/')?path.join(root,'dist'):root;
  const file = path.resolve(staticRoot, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  const stat = fs.statSync(file); if (!stat.isFile()) { res.writeHead(404); return res.end(); }
  let start = 0, end = stat.size - 1, status = 200;
  const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
  if (req.headers.range) {
   const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return res.end(); }
   if (!match[1]) start = Math.max(0,stat.size - Number(match[2]));
   else { start = Number(match[1]); if (match[2]) end = Math.min(Number(match[2]),end); }
   if (start > end || start >= stat.size) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); return res.end(); }
   status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status,headers);
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(file,{start,end}); stream.on('error',() => res.destroy()); stream.pipe(res);
 } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port,'127.0.0.1',() => console.log(`Vible is ready at http://127.0.0.1:${port}`));
