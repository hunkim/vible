import {assetURL} from '../assets.js';
import {ImageResponse} from '@vercel/og';
import fs from 'node:fs/promises';
import {selection} from '../share-data.mjs';
import {cardLayout} from '../share-card-layout.mjs';

const hosting=fs.readFile(new URL('../asset-hosting.json',import.meta.url),'utf8').then(JSON.parse);
const font=fs.readFile(new URL('../fonts/NanumMyeongjo-Regular.ttf',import.meta.url));
const h=(type,style,children)=>({type,props:{style,children}});
export async function cardResponse(s){
 const {size,height,textWidth}=cardLayout(s);
 const origin=process.env.VIBLE_ASSET_ORIGIN??(await hosting).origin;
 let bytes;
 if(s.image==='image-pending.svg')bytes=await fs.readFile(new URL('../assets/image-pending.svg',import.meta.url));
 else if(!origin){assetURL(s.image,'');bytes=await fs.readFile(new URL('../assets/'+s.image,import.meta.url));}
 else{const image=new URL(assetURL(s.image,origin),'https://vible.now/').href;const asset=await fetch(image,{signal:AbortSignal.timeout(10000)});if(!asset.ok)throw Error('장면 이미지를 불러오지 못했습니다.');bytes=Buffer.from(await asset.arrayBuffer());}
 const imageData=`data:${s.image.endsWith('.svg')?'image/svg+xml':'image/jpeg'};base64,${bytes.toString('base64')}`;
 return new ImageResponse(h('div',{display:'flex',width:'100%',height:'100%',position:'relative',backgroundColor:'#172a22',fontFamily:'Scripture',color:'#fff9ed'},[
  {type:'img',props:{src:imageData,width:1200,height,style:{position:'absolute',width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}},
  h('div',{position:'absolute',top:0,left:0,width:'100%',height:'100%',backgroundImage:'linear-gradient(90deg,rgba(12,27,22,.94) 0%,rgba(12,27,22,.82) 38%,rgba(12,27,22,.25) 57%,rgba(12,27,22,0) 75%)'},null),
  h('div',{display:'flex',flexDirection:'column',justifyContent:'center',padding:'76px 0 90px 52px',width:textWidth+52,height:'100%'},[
   h('div',{fontSize:22,color:'#e7d5ac',marginBottom:22},s.reference),
   h('div',{display:'flex',flexDirection:'column',fontSize:size,lineHeight:1.65,wordBreak:s.lang==='ja'||s.lang==='zh'?'break-all':'normal'},s.verses.map(v=>h('div',{marginBottom:s.verses.length>1?16:0},v.text)))
  ]),
  h('div',{position:'absolute',right:40,bottom:s.lang==='zh'?84:46,fontSize:20,color:'#fff9ed',backgroundColor:'rgba(12,27,22,.55)',padding:'10px 16px',borderRadius:8},'vible.now'),
  h('div',{position:'absolute',display:'flex',bottom:16,left:52,right:52,fontSize:13,lineHeight:1.4,color:'#e7d5ac',backgroundColor:s.lang==='zh'?'rgba(12,27,22,.88)':'transparent',padding:s.lang==='zh'?8:0},s.lang==='zh'?s.attribution+' · Scripture and this card: CC BY-SA 4.0 · https://creativecommons.org/licenses/by-sa/4.0/':s.translation||'성경전서 개역한글판')
 ]),{width:1200,height,fonts:[{name:'Scripture',data:await font,weight:400,style:'normal'}]});
}
export default async function handler(req,res){
 try{
  const s=selection(new URL(req.url,'https://vible.now').searchParams),image=await cardResponse(s);
  const png=Buffer.from(await image.arrayBuffer());
  res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'public, max-age=86400, s-maxage=604800','X-Content-Type-Options':'nosniff'});res.end(png);
 }catch(e){console.error('Shared card:',e.message);res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('말씀 카드를 만들지 못했습니다. 말씀 주소를 확인해 주세요.');}
}
