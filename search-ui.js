import {fetchContent} from './platform.js';
import {findScripture,excerpt,highlightText} from './scripture-search.js';
const copy={
 ko:{title:'말씀 찾기',placeholder:'단어, 문구 또는 요 3:16',all:'전체 성경',current:'현재 책',intro:'마음에 남은 말씀을 찾아보세요',help:'단어·문구 또는 책 이름과 장·절로 검색하세요.',examples:['사랑','은혜','두려워 말라','요 3:16'],loading:'말씀을 준비하고 있습니다…',error:'검색을 불러오지 못했습니다.',retry:'다시 시도',empty:'찾는 말씀이 없습니다',emptyHelp:'짧은 단어나 다른 표현으로 찾아보세요.',count:n=>`${n.toLocaleString()}절`,coverage:n=>`한국어 · ${n}권`,more:'더 보기',close:'검색 닫기',clear:'검색어 지우기',open:'말씀 검색',shortcut:'⌘ K / Ctrl K',unavailable:'현재 책의 이 언어 번역은 준비 중입니다.'},
 en:{title:'Find Scripture',placeholder:'Word, phrase or John 3:16',all:'All books',current:'This book',intro:'Find the words that stay with you',help:'Search a word, phrase or Bible reference.',examples:['love','grace','do not fear','John 3:16'],loading:'Preparing Scripture…',error:'Unable to load search.',retry:'Try again',empty:'No verses found',emptyHelp:'Try a shorter word or a different phrase.',count:n=>`${n.toLocaleString()} verses`,coverage:n=>`English · ${n} books`,more:'Show more',close:'Close search',clear:'Clear search',open:'Search Scripture',shortcut:'⌘ K / Ctrl K',unavailable:'This book is not available in this language yet.'},
 ja:{title:'みことばを探す',placeholder:'言葉・文章 または ヨハネ 3:16',all:'すべての書',current:'現在の書',intro:'心に残るみことばを探しましょう',help:'言葉や文章、書名と章・節で検索できます。',examples:['愛','恵み','恐れるな','ヨハネ 3:16'],loading:'みことばを準備しています…',error:'検索を読み込めませんでした。',retry:'再試行',empty:'みことばが見つかりません',emptyHelp:'短い言葉や別の表現で検索してください。',count:n=>`${n.toLocaleString()}節`,coverage:n=>`日本語 · ${n}書`,more:'もっと見る',close:'検索を閉じる',clear:'検索語を消す',open:'みことばを検索',shortcut:'⌘ K / Ctrl K',unavailable:'この書の翻訳は準備中です。'},
 zh:{title:'查找经文',placeholder:'词语、句子 或 约翰福音 3:16',all:'全部书卷',current:'当前书卷',intro:'寻找留在心中的经文',help:'输入词语、句子或书卷名称与章、节。',examples:['爱','恩典','不要怕','约翰福音 3:16'],loading:'正在准备经文…',error:'无法加载搜索。',retry:'重试',empty:'未找到经文',emptyHelp:'试试更短的词语或其他表达。',count:n=>`${n.toLocaleString()}节`,coverage:n=>`中文 · ${n}卷`,more:'显示更多',close:'关闭搜索',clear:'清除搜索',open:'搜索经文',shortcut:'⌘ K / Ctrl K',unavailable:'本书的此语言译本正在准备中。'}
};
export function scriptureSearch(getContext,openVerse){
 const $=id=>document.getElementById(id),dialog=$('scripture-search'),input=$('scripture-query'),results=$('scripture-results'),status=$('scripture-status'),cache=new Map();
 let index=null,scope='',limit=30,generation=0,timer,composing=false,lang='ko',returnToReader=false,navigating=false,headerComposing=false,live=false;
 const c=()=>copy[lang];
 function message(title,detail='',retry=false){results.replaceChildren();const box=document.createElement('div');box.className='search-message';const heading=document.createElement('strong');heading.textContent=title;const p=document.createElement('p');p.textContent=detail;box.append(heading,p);if(retry){const b=document.createElement('button');b.textContent=c().retry;b.onclick=()=>{cache.delete(lang);load();};box.append(b);}results.append(box);}
 function render(){
  $('clear-scripture-query').hidden=!input.value;$('search-more').hidden=true;results.scrollTop=0;
  if(!index)return;
  if(!input.value.trim()){
   status.textContent=c().coverage(index.books.length);message(c().intro,c().help);
   const choices=document.createElement('div');choices.className='search-examples';for(const query of c().examples){const b=document.createElement('button');b.textContent=query;b.onclick=()=>{input.value=query;limit=30;render();$(live?'header-query':'scripture-query').focus();};choices.append(b);}results.firstChild.append(choices);return;
  }
  const found=findScripture(index,input.value,{book:scope,limit});status.textContent=c().count(found.total);results.replaceChildren();
  if(!found.total){message(c().empty,c().emptyHelp);return;}
  for(const verse of found.results){
   const book=index.books.find(b=>b.id===verse.book),button=document.createElement('button');button.className='scripture-result';
   const info=document.createElement('div'),ref=document.createElement('strong');ref.textContent=`${book.name} ${verse.chapter}:${verse.verse}${verse.endVerse!==verse.verse?'–'+verse.endVerse:''}`;
   const text=document.createElement('p');highlightText(text,excerpt(verse.text,found.address?'':input.value),found.address?'':input.value);info.append(ref,text);
   const img=document.createElement('img');img.src=`assets/${book.images[verse.scene-1]}`;img.alt='';img.loading='lazy';img.width=76;img.height=76;button.append(info,img);
   button.onclick=async()=>{if(navigating)return;navigating=true;button.disabled=true;status.textContent=c().loading;try{await openVerse({...verse,language:lang});returnToReader=true;dialog.close();}catch{button.disabled=false;status.textContent=c().error;}finally{navigating=false;}};results.append(button);
  }
  $('search-more').hidden=found.total<=limit;
 }
 async function load(){
  const ticket=++generation;index=null;status.textContent=c().loading;message(c().loading);results.setAttribute('aria-busy','true');
  try{
   if(!cache.has(lang))cache.set(lang,fetchContent(`data/search/${lang}.json`).then(async r=>{if(!r.ok)throw Error('Search unavailable');return r.json();}));
   const next=await cache.get(lang);if(ticket!==generation||!dialog.open)return;index=next;$('search-all').textContent=`${c().all} · ${index.books.length}`;render();
  }catch{if(ticket===generation&&dialog.open){cache.delete(lang);status.textContent='';message(c().error,'',true);}}
  finally{if(ticket===generation)results.setAttribute('aria-busy','false');}
 }
 function open(options={}){
  if(getContext().ready===false)return;
  if(dialog.open){if(!live)input.focus();return;}
  live=options.live===true;dialog.classList.toggle('live-search',live);const context=getContext();lang=context.language;scope='';limit=30;returnToReader=false;input.value=$('header-query').value;
  $('scripture-search-title').textContent=c().title;input.placeholder=c().placeholder;input.setAttribute('aria-label',c().open);$('close-scripture-search').setAttribute('aria-label',c().close);$('clear-scripture-query').setAttribute('aria-label',c().clear);$('search-all').textContent=c().all;$('search-current').textContent=context.name;$('search-more').textContent=c().more;
  $('search-all').setAttribute('aria-pressed','true');$('search-current').setAttribute('aria-pressed','false');if(live)dialog.setAttribute('open','');else{dialog.showModal();input.focus();}fitViewport();load();
 }
 function fitViewport(){if(!dialog.open)return;const field=$('toolbar-search').getBoundingClientRect();if(innerWidth<=700){dialog.style.setProperty('--search-height',`${Math.max(120,(window.visualViewport?.height||innerHeight)-(live?field.bottom+8:0))}px`);dialog.style.setProperty('--search-top',`${field.bottom+8}px`);}else{dialog.style.setProperty('--search-left',`${Math.max(24,Math.min(field.left,innerWidth-dialog.offsetWidth-24))}px`);dialog.style.setProperty('--search-top',`${field.bottom+10}px`);}}
 window.visualViewport?.addEventListener('resize',fitViewport);window.addEventListener('resize',fitViewport);
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.isComposing){e.preventDefault();e.stopPropagation();dialog.close();}});
 $('close-header-search').onclick=()=>{clearTimeout(timer);$('header-query').value='';input.value='';headerComposing=false;returnToReader=true;if(dialog.open)dialog.close();$('reader').focus({preventScroll:true});};
 $('header-query').addEventListener('compositionstart',()=>{headerComposing=true;});$('header-query').addEventListener('compositionend',()=>{headerComposing=false;updateHeader();});
 $('header-query').addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.isComposing){e.preventDefault();returnToReader=true;if(dialog.open)dialog.close();$('reader').focus({preventScroll:true});}});
 function updateHeader(){clearTimeout(timer);input.value=$('header-query').value;if(!input.value.trim()){if(dialog.open&&live)dialog.close();return;}if(!dialog.open)open({live:true});timer=setTimeout(()=>{limit=30;render();},120);}
 $('header-query').addEventListener('input',updateHeader);
 document.addEventListener('pointerdown',e=>{if(live&&dialog.open&&!dialog.contains(e.target)&&!$('toolbar-search').contains(e.target))dialog.close();});
 $('toolbar-search').addEventListener('submit',e=>{e.preventDefault();if(!headerComposing)open();});$('close-scripture-search').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{generation++;clearTimeout(timer);$('header-query').value=input.value;$(returnToReader||(!live&&innerWidth<=700)?'reader':'header-query').focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
 $('clear-scripture-query').onclick=()=>{input.value='';limit=30;render();$(live?'header-query':'scripture-query').focus();};
 input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{limit=30;render();},120);});
 input.addEventListener('compositionstart',()=>{composing=true;clearTimeout(timer);});input.addEventListener('compositionend',()=>{composing=false;limit=30;render();});
 for(const [id,value] of [['search-all',''],['search-current',null]])$(id).onclick=()=>{scope=value===null?getContext().bookId:value;limit=30;for(const key of ['search-all','search-current'])$(key).setAttribute('aria-pressed',String(key===id));render();$(live?'header-query':'scripture-query').focus();};
 $('search-more').onclick=()=>{const top=results.scrollTop;limit+=30;render();results.scrollTop=top;};
 input.addEventListener('keydown',e=>{if(e.isComposing||composing)return;if(e.key==='ArrowDown'){const first=results.querySelector('.scripture-result');if(first){e.preventDefault();first.focus();}}if(e.key==='Enter'){e.preventDefault();clearTimeout(timer);limit=30;render();const matches=results.querySelectorAll('.scripture-result');if(matches.length===1)matches[0].click();else matches[0]?.focus();}});
 results.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key)||e.isComposing)return;const buttons=Array.from(results.querySelectorAll('.scripture-result')),position=buttons.indexOf(document.activeElement);if(position<0)return;e.preventDefault();if(e.key==='ArrowUp'&&position===0)input.focus();else buttons[position+(e.key==='ArrowDown'?1:-1)]?.focus();});
 document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'&&!e.isComposing){e.preventDefault();open();}});
 return {localize(){$('header-query').disabled=false;$('open-search').disabled=false;const language=getContext().language;const label=copy[language].open;$('close-header-search').setAttribute('aria-label',copy[language].close);const example=copy[language].examples.at(-1);$('header-query').placeholder=`${label} · ${example}`;$('header-query').setAttribute('aria-label',label);document.querySelector('.search-shortcut').textContent=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘ K':'Ctrl K';$('open-search').setAttribute('aria-label',label);$('open-search').title=`${label} · ${copy[language].shortcut}`;}};
}
