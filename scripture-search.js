import {bookNames} from './languages.js';
const abbreviations={genesis:['창','gen'],exodus:['출','exod','exo'],leviticus:['레','lev'],numbers:['민','num'],deuteronomy:['신','deut','deu'],joshua:['수','jos','josh','ヨシュア','书','書','约书亚','約書亞'],judges:['삿','jdg','judg','士師','士师'],ruth:['룻','rut','ルツ','得','路得'],'1samuel':['삼상','1 sam','1sa','サムエル記上','撒上'],'2samuel':['삼하','2 sam','2sa','サムエル記下','撒下'],'1kings':['왕상','1 kgs','1ki','列王記上','王上'],'2kings':['왕하','2 kgs','2ki','列王記下','王下'],psalms:['시','시편','ps','psalm','詩篇','詩編','诗篇'],proverbs:['잠','prov','pro','箴言'],matthew:['마','matt','mt'],mark:['막','mk'],luke:['눅','lk'],john:['요','jn','ヨハネ','约','約','约翰','約翰'],acts:['행','ac','使徒','徒'],romans:['롬','rom','ローマ','罗','羅'], '1corinthians':['고전','1 cor','1co'],'2corinthians':['고후','2 cor','2co'],galatians:['갈','gal'],ephesians:['엡','eph'],philippians:['빌','phil'],colossians:['골','col'],'1thessalonians':['살전','1 thess'],'2thessalonians':['살후','2 thess'],'1timothy':['딤전','1 tim'],'2timothy':['딤후','2 tim'],titus:['딛','tit'],philemon:['몬','phlm'],hebrews:['히','heb'],james:['약','jas'],'1peter':['벧전','1 pet'],'2peter':['벧후','2 pet'],'1john':['요일','1 jn'],'2john':['요이','2 jn'],'3john':['요삼','3 jn'],jude:['유','jud'],revelation:['계','rev','黙示録','ヨハネの黙示録','启','啟']};
export const normalize=text=>String(text).normalize('NFKC').toLocaleLowerCase().replace(/[\s.,·]/gu,'');
export function createSearchIndex(books,language){
 const order=Object.keys(abbreviations);books=[...books].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 return {language,books:books.map(({id,data})=>({id,name:data.book,aliases:[id,...Object.values(bookNames).map(names=>names[id]),...(abbreviations[id]||[])].filter(Boolean),images:data.scenes.map(s=>s.image)})),verses:books.flatMap(({id,data})=>data.scenes.flatMap(s=>s.verses.filter(v=>!v.omitted&&!v.combinedWith).map(v=>[id,s.chapter,v.verse,v.text,s.id,v.endVerse||v.verse])))};
}
export function findScripture(index,query,{book='',limit=30}={}){
 const value=query.normalize('NFKC').trim();if(!value)return {results:[],total:0};
 const address=value.match(/^(.+?)\s*(\d+)\s*(?:(?::|장)\s*(\d+)\s*(?:[-–]\s*(\d+))?\s*절?)?\s*$/u);
 const target=address&&index.books.find(b=>b.aliases.some(alias=>normalize(alias)===normalize(address[1])));
 const phrase=normalize(value),terms=value.split(/\s+/u).map(normalize).filter(Boolean);
 const matches=[];
 for(const row of index.verses){
  if(book&&row[0]!==book)continue;
  let score=0;
  if(target){
   if(row[0]!==target.id||row[1]!==Number(address[2]))continue;
   if(address[3]&&(row[5]<Number(address[3])||row[2]>Number(address[4]||address[3])))continue;
   score=100;
  }else{
   const text=normalize(row[3]);if(text.includes(phrase))score=60;else if(terms.every(term=>text.includes(term)))score=30;else continue;
  }
  matches.push({row,score});
 }
 matches.sort((a,b)=>b.score-a.score);
 return {results:matches.slice(0,limit).map(({row})=>({book:row[0],chapter:row[1],verse:row[2],text:row[3],scene:row[4],endVerse:row[5]})),total:matches.length,address:!!target};
}
export function excerpt(text,query,max=210){
 if(text.length<=max)return text;
 const terms=query.trim().split(/\s+/u).filter(Boolean),lower=text.toLocaleLowerCase();
 const positions=terms.map(t=>lower.indexOf(t.toLocaleLowerCase())).filter(n=>n>=0);
 const start=Math.max(0,(positions.length?Math.min(...positions):0)-35);
 return (start?'…':'')+text.slice(start,start+max)+(start+max<text.length?'…':'');
}
export function highlightText(element,text,query){
 const terms=query.trim().split(/\s+/u).filter(Boolean).sort((a,b)=>b.length-a.length);
 if(!terms.length){element.textContent=text;return;}
 const pattern=new RegExp(terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'giu');
 let end=0;for(const match of text.matchAll(pattern)){element.append(document.createTextNode(text.slice(end,match.index)));const mark=document.createElement('mark');mark.textContent=match[0];element.append(mark);end=match.index+match[0].length;}element.append(document.createTextNode(text.slice(end)));
}

export function bookSearchAliases(id){return [id,...Object.values(bookNames).map(names=>names[id]),...(abbreviations[id]||[])].filter(Boolean);}
