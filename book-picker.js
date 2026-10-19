import {normalize,bookSearchAliases} from './scripture-search.js';
import {bibleBooks} from './bible-books.js';
const copy={ko:{title:'책 선택',search:'책 이름·약칭으로 찾기',recent:'최근 읽은 책',old:'구약',next:'신약',empty:'일치하는 책이 없습니다',close:'책 선택 닫기',soon:'준비 중',chapter:n=>`${n}장`,resume:n=>`이어 읽기 · ${n}장`,start:'1장부터',chapters:n=>`${n}장`,go:(book,n)=>`${book} ${n}장`,all:'전체 책',pick:'장 선택',hint:'창 12 · 시 23'},en:{title:'Choose a book',search:'Book name or abbreviation',recent:'Recently read',old:'Old Testament',next:'New Testament',empty:'No matching books',close:'Close book picker',soon:'Coming soon',chapter:n=>String(n),resume:n=>`Continue · chapter ${n}`,start:'Start at chapter 1',chapters:n=>`${n} chapters`,go:(book,n)=>`${book} ${n}`,all:'All books',pick:'Choose a chapter',hint:'Gen 12 · Ps 23'},ja:{title:'書を選ぶ',search:'書名・略称で検索',recent:'最近読んだ書',old:'旧約聖書',next:'新約聖書',empty:'一致する書がありません',close:'書の選択を閉じる',soon:'準備中',chapter:n=>`${n}章`,resume:n=>`続きから · ${n}章`,start:'1章から',chapters:n=>`全${n}章`,go:(book,n)=>`${book} ${n}章`,all:'すべての書',pick:'章を選ぶ',hint:'創 12 · 詩 23'},zh:{title:'选择书卷',search:'输入书卷名称或简称',recent:'最近阅读',old:'旧约',next:'新约',empty:'未找到书卷',close:'关闭书卷选择',soon:'准备中',chapter:n=>`${n}`,resume:n=>`继续阅读 · 第${n}章`,start:'从第1章开始',chapters:n=>`共${n}章`,go:(book,n)=>`${book} 第${n}章`,all:'全部书卷',pick:'选择章节',hint:'创 12 · 诗 23'}};
const chapterCount=Object.fromEntries(bibleBooks.map(book=>[book.id,book.chapters]));
export function filterBooks(books,query){const term=normalize(query);return books.filter(book=>!term||[book.name,...bookSearchAliases(book.id)].some(alias=>normalize(alias).includes(term)));}
// "창 12", "시편23", "John 3:16" → the book and chapter to open directly from the search box.
export function chapterQuery(books,query){
 const match=String(query).trim().match(/^(.+?)\s*(\d+)(?:\s*[:：.]\s*(\d+))?\s*(?:장|章|편|篇)?$/u);if(!match)return null;
 const term=normalize(match[1]),chapter=Number(match[2]);if(!term)return null;
 const open=books.filter(book=>!book.soon),exact=open.filter(book=>[book.name,...bookSearchAliases(book.id)].some(alias=>normalize(alias)===term));
 const found=exact.length?exact:filterBooks(open,match[1]);
 return found.length===1&&chapter>=1&&chapter<=(chapterCount[found[0].id]||0)?{book:found[0],chapter,verse:match[3]?Number(match[3]):null}:null;
}
export function bookPicker(getContext,{openChapter=()=>{},lastChapter=()=>null}={}){
 const $=id=>document.getElementById(id),select=$('book'),toggle=$('open-book'),dialog=$('book-picker-dialog'),input=$('book-query'),results=$('book-results');
 let recent=[],composing=false,expanded=null,only=null;try{recent=JSON.parse(localStorage.getItem('vible-recent-books')||'[]');if(!Array.isArray(recent))recent=[];}catch{}
 // Wide screens with a mouse show chapters in a side panel; touch and narrow screens expand them under the book.
 const wide=()=>typeof matchMedia==='function'&&matchMedia('(min-width: 760px) and (hover: hover)').matches;
 const side=document.createElement('div');side.id='book-chapters';side.className='book-chapters';
 const c=()=>copy[getContext().language]||copy.ko;const books=()=>Array.from(select.options,option=>({id:option.value,name:option.textContent,soon:option.disabled}));
 function go(id,chapter,verse=null){dialog.close();openChapter(id,chapter,verse);}
 function choose(id){go(id,lastChapter(id)||1);}
 function chapterPanel(book){
  const panel=document.createElement('div');panel.className='chapter-panel';
  // One header line: the book name (opens the last-read chapter or chapter 1) and either "Continue · N" or the chapter count.
  const head=document.createElement('div');head.className='chapter-panel-head';const last=lastChapter(book.id);
  const title=document.createElement('button');title.type='button';title.className='chapter-panel-title';title.textContent=book.name;title.onclick=()=>go(book.id,last||1);head.append(title);
  if(last){const resume=document.createElement('button');resume.type='button';resume.className='chapter-resume';resume.textContent=`${c().resume(last)} →`;resume.onclick=()=>go(book.id,last);head.append(resume);}
  else{const count=document.createElement('small');count.textContent=c().chapters(chapterCount[book.id]||0);head.append(count);}
  const grid=document.createElement('div');grid.className='chapter-grid';
  for(let n=1;n<=(chapterCount[book.id]||0);n++){const button=document.createElement('button');button.type='button';button.textContent=String(n);button.setAttribute('aria-label',c().go(book.name,n));if(n===last)button.className='chapter-current';button.onclick=()=>go(book.id,n);grid.append(button);}
  panel.append(head,grid);return panel;
 }
 function showSide(book){if(!book)return side.replaceChildren();side.replaceChildren(chapterPanel(book));}
 function group(title,items){
  if(!items.length)return;const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');heading.textContent=title;grid.className='book-grid';
  items.forEach((book,index)=>{
   const button=document.createElement('button');button.type='button';button.textContent=book.name;
   if(book.soon){button.disabled=true;button.className='book-soon';const label=document.createElement('small');label.textContent=c().soon;button.append(label);grid.append(button);return;}
   button.setAttribute('aria-pressed',String(book.id===getContext().bookId));
   if(wide()){button.onclick=()=>choose(book.id);button.onmouseenter=button.onfocus=()=>showSide(book);}
   else{button.setAttribute('aria-expanded',String(expanded===book.id));button.onclick=()=>{expanded=expanded===book.id?null:book.id;render();};}
   grid.append(button);
   // The expanded chapter grid spans the full row right after the pair of books that contains the tapped book.
   const rowEnd=index%2===1||index===items.length-1;
   if(!wide()&&rowEnd){const open=items.slice(index-(index%2),index+1).find(item=>item.id===expanded);if(open)grid.append(chapterPanel(open));}
  });
  section.append(heading,grid);results.append(section);
 }
 function render(){
  results.replaceChildren();const all=books();
  if(only){const book=all.find(item=>item.id===only);if(book){const back=document.createElement('button');back.type='button';back.className='chapter-all-books';back.textContent=`← ${c().all}`;back.onclick=()=>{only=null;expanded=getContext().bookId;render();};results.append(chapterPanel(book),back);return;}}
  const jump=chapterQuery(all,input.value);
  if(jump){const button=document.createElement('button');button.type='button';button.className='chapter-jump-result';button.textContent=`${jump.verse?`${jump.book.name} ${jump.chapter}:${jump.verse}`:c().go(jump.book.name,jump.chapter)} →`;button.onclick=()=>go(jump.book.id,jump.chapter,jump.verse);results.append(button);}
  const found=filterBooks(all,jump?'':input.value),split=all.findIndex(book=>book.id==='matthew'),old=new Set(all.slice(0,Math.max(0,split)).map(book=>book.id));
  if(!jump){
   if(!input.value.trim())group(c().recent,recent.slice(0,3).map(id=>all.find(book=>book.id===id&&!book.soon)).filter(Boolean));
   group(c().old,found.filter(book=>old.has(book.id)));group(c().next,found.filter(book=>!old.has(book.id)));
   if(!found.length){const empty=document.createElement('p');empty.className='book-empty';empty.textContent=c().empty;results.append(empty);}
  }
  if(wide()&&!only)showSide(all.find(book=>book.id===(expanded||getContext().bookId)&&!book.soon));
 }
 function layout(){const two=wide()&&!only;dialog.classList?.toggle('two-pane',two);if(two&&side.parentNode!==dialog)dialog.append(side);if(!two&&side.parentNode)side.remove();}
 function position(){if(!dialog.open)return;const rect=toggle.getBoundingClientRect(),width=Math.min(wide()&&!only?720:380,innerWidth-16);dialog.style.width=`${width}px`;dialog.style.left=`${Math.max(8,Math.min(rect.left,innerWidth-width-8))}px`;dialog.style.top=`${rect.bottom+8}px`;dialog.style.maxHeight=`${Math.max(150,(window.visualViewport?.height||innerHeight)-rect.bottom-16)}px`;}
 function open(bookOnly=null){
  if(select.disabled)return;only=bookOnly;expanded=bookOnly?null:getContext().bookId;
  $('book-picker-title').textContent=only?c().pick:c().title;input.placeholder=`${c().search} · ${c().hint}`;input.setAttribute('aria-label',c().search);$('close-book-picker').setAttribute('aria-label',c().close);input.value='';input.hidden=!!only;
  layout();render();dialog.showModal();position();toggle.setAttribute('aria-expanded','true');if(!only)input.focus();
  const current=results.querySelector?.('.chapter-current');current?.scrollIntoView?.({block:'center'});
 }
 toggle.onclick=()=>open();
 $('close-book-picker').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');input.hidden=false;if(!only)toggle.focus({preventScroll:true});only=null;});
 dialog.addEventListener('click',e=>{const rect=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))dialog.close();});
 input.addEventListener('input',render);input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;render();});
 input.addEventListener('keydown',e=>{if(e.isComposing||composing)return;if(e.key==='ArrowDown'||e.key==='Enter'){const items=results.querySelectorAll('button:not([disabled])');if(items.length){e.preventDefault();const jump=results.querySelector('.chapter-jump-result');if(e.key==='Enter'&&(jump||items.length===1))(jump||items[0]).click();else items[0].focus();}}});
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.isComposing){e.preventDefault();dialog.close();}});window.addEventListener('resize',()=>{if(dialog.open){layout();render();}position();});window.visualViewport?.addEventListener('resize',position);
 new MutationObserver(()=>{toggle.disabled=select.disabled;}).observe(select,{attributes:true,attributeFilter:['disabled']});
 return {openChapters(id){open(id);},localize(){const context=getContext(),name=Array.from(select.options).find(option=>option.value===context.bookId)?.textContent||'';$('selected-book-name').textContent=name;toggle.title=name;toggle.setAttribute('aria-label',`${c().title}: ${name}`);recent=[context.bookId,...recent.filter(id=>id!==context.bookId)].slice(0,6);try{localStorage.setItem('vible-recent-books',JSON.stringify(recent));}catch{}}};
}
