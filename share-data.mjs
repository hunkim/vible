import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {releaseData,releaseVersion} from './release-data.mjs';
import {normalizeLanguage,passageURL,applyTranslation,validateEditions,noEditions,findEdition,editionCovers,editionForBook,editionFile,editionList,shareEditionId} from './languages.js';

const hosting=JSON.parse(fs.readFileSync(new URL('./asset-hosting.json',import.meta.url),'utf8'));
export function cardVersion(s){return createHash('sha256').update(JSON.stringify([s.image,hosting.files[s.image]?.sha256||s.image,s.lang,s.reference,s.text,s.attribution,s.translation,s.licenseSource,'card-v1'])).digest('hex').slice(0,24);}
const books=new Map();
let cachedReleaseVersion='';
const allowed=['john','acts','romans','revelation','genesis','matthew','mark','luke',...JSON.parse(fs.readFileSync(new URL('./epistles-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./pentateuch-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./historical-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./psalms-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./proverbs-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./songofsongs-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./1chronicles-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./2chronicles-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./ezra-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./nehemiah-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./esther-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./job-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./ecclesiastes-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./daniel-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./jonah-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./jeremiah-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./ezekiel-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./hosea-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./isaiah-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./minorprophets-books.json',import.meta.url),'utf8')).map(book=>book.id),...JSON.parse(fs.readFileSync(new URL('./lamentations-books.json',import.meta.url),'utf8')).map(book=>book.id)];
export const sharePath=passageURL;
// Optional edition registry; without it every language shows its base text exactly as before.
const editionsFile=new URL('./data/translations/editions.json',import.meta.url);let editionsVersion='',editions=noEditions;
export function editionRegistry(){
 let version='';try{const stat=fs.statSync(editionsFile);version=`${stat.mtimeMs}:${stat.size}`;}catch(error){if(error.code!=='ENOENT')throw error;}
 if(version!==editionsVersion){editions=version?validateEditions(JSON.parse(fs.readFileSync(editionsFile,'utf8'))):noEditions;editionsVersion=version;books.clear();}
 return editions;
}
export function shareParams(url){
 const match=url.pathname.match(/^\/share\/([a-z0-9]+)\/(\d+)\/(\d+)(?:\/(\d+)\/(\d+))?\/?$/);
 if(!match)return url.searchParams;
 return new URLSearchParams({book:match[1],chapter:match[2],verse:match[3],endChapter:match[4]||match[2],endVerse:match[5]||match[3],lang:url.searchParams.get('lang')||'ko',...(url.searchParams.get('ed')?{ed:url.searchParams.get('ed')}:{})});
}
export function selection(params){
 const version=releaseVersion();if(version!==cachedReleaseVersion){books.clear();cachedReleaseVersion=version;}
 const registry=editionRegistry();
 const requested=params.get('lang')||'ko',lang=normalizeLanguage(requested);
 if(!lang)throw Error('Unsupported language');
 const book=params.get('book');let chapter=Number(params.get('chapter')),verse=Number(params.get('verse'));
 let endChapter=Number(params.get('endChapter')??chapter),endVerse=Number(params.get('endVerse')??verse);
 if(!allowed.includes(book)||![chapter,verse,endChapter,endVerse].every(n=>Number.isInteger(n)&&n>0))throw Error('말씀 주소를 확인해 주세요.');
 if(!books.has(book))books.set(book,releaseData(book,JSON.parse(fs.readFileSync(new URL(`./data/${book}.json`,import.meta.url),'utf8'))));
 // `ed` picks another edition of this language when it has this book; otherwise the passage shows the language's usual text.
 const requestedEdition=findEdition(registry,lang,params.get('ed')||''),edition=editionCovers(requestedEdition,book)?requestedEdition:editionForBook(registry,lang,book);
 const editionURL=editionFile(edition,book)?new URL(`./${editionFile(edition,book)}`,import.meta.url):null;
 const shown=editionURL&&fs.existsSync(editionURL)?edition:null;
 const cacheKey=shown?`${book}:${lang}:${shown.id}`:`${book}:${lang}`;
 if(shown&&!books.has(cacheKey))books.set(cacheKey,{...applyTranslation(books.get(book),JSON.parse(fs.readFileSync(editionURL,'utf8')),lang),edition:shown.id});
 if(!books.has(cacheKey)){
  const file=new URL(`./data/translations/${lang}/${book}.json`,import.meta.url);
  if(fs.existsSync(file))books.set(cacheKey,applyTranslation(books.get(book),JSON.parse(fs.readFileSync(file,'utf8')),lang));
  else if(lang==='ko')books.set(cacheKey,books.get(book));
  else throw Error('This translation is not available yet.');
 }
 const data=books.get(cacheKey),all=data.scenes.flatMap(s=>s.verses.map(v=>({...v,chapter:s.chapter,scene:s})));
 const startVerse=all.find(v=>v.chapter===chapter&&v.verse===verse),endVerseRecord=all.find(v=>v.chapter===endChapter&&v.verse===endVerse);
 if(startVerse?.combinedWith)verse=startVerse.combinedWith;
 if(endVerseRecord?.combinedWith)endVerse=all.find(v=>v.chapter===endChapter&&v.verse===endVerseRecord.combinedWith).endVerse;
 else if(endVerseRecord?.endVerse)endVerse=endVerseRecord.endVerse;
 const start=all.findIndex(v=>v.chapter===chapter&&v.verse===verse),end=all.findIndex(v=>v.chapter===endChapter&&v.verse===endVerse);
 if(start<0||end<start)throw Error('말씀 주소를 확인해 주세요.');
 const verses=all.slice(start,end+1).filter(v=>!v.omitted),text=verses.map(v=>v.text).join('\n');
 if(!text.trim())throw Error('This passage is not present in this translation.');
 if(text.length>6000)throw Error('한 번에 나눌 말씀을 조금 짧게 선택해 주세요.');
 const reference=`${data.book} ${chapter}:${verse}${end===start?'':chapter===endChapter?`–${endVerse}`:`–${endChapter}:${endVerse}`}`;
 const shownId=shown?.id||editionList(registry,lang).find(e=>e.base)?.id||'',editionParam=shareEditionId(registry,lang,book,shownId);
 return {lang,attribution:data.attribution,translation:data.translation,licenseSource:data.copyrightSource,book,chapter,verse,endChapter,endVerse,verses,text,reference,image:all[start].scene.image,path:sharePath(book,chapter,verse,endChapter,endVerse,lang,editionParam),...(shown?{edition:shown.id}:{}),...(editionParam?{editionParam}:{})};
}
export const escapeHTML=text=>String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
