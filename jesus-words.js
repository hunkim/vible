import {jesusWords} from './jesus-words-data.js';
function fingerprint(text){let value=2166136261;for(const char of text)value=Math.imul(value^char.codePointAt(0),16777619)>>>0;return value;}
export function scriptureParts(book,chapter,verse,language,text){
 const record=jesusWords[language]?.[book]?.[`${chapter}:${verse}`];
 if(!record||record[0]!==fingerprint(text))return [{text,jesus:false}];
 const parts=[];let cursor=0;
 for(const [start,end] of record[1]){
  if(start<cursor||end>text.length||end<=start)return [{text,jesus:false}];
  if(start>cursor)parts.push({text:text.slice(cursor,start),jesus:false});
  parts.push({text:text.slice(start,end),jesus:true});cursor=end;
 }
 if(cursor<text.length)parts.push({text:text.slice(cursor),jesus:false});
 return parts;
}
export function renderScripture(element,book,chapter,verse,language,text){
 for(const part of scriptureParts(book,chapter,verse,language,text)){
  if(!part.jesus){element.append(document.createTextNode(part.text));continue;}
  const words=document.createElement('strong');words.className='jesus-words';words.textContent=part.text;element.append(words);
 }
}
