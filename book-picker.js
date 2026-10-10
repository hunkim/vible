import {normalize,bookSearchAliases} from './scripture-search.js';
const copy={ko:{title:'책 선택',search:'책 이름·약칭으로 찾기',recent:'최근 읽은 책',old:'구약',next:'신약',empty:'일치하는 책이 없습니다',close:'책 선택 닫기'},en:{title:'Choose a book',search:'Book name or abbreviation',recent:'Recently read',old:'Old Testament',next:'New Testament',empty:'No matching books',close:'Close book picker'},ja:{title:'書を選ぶ',search:'書名・略称で検索',recent:'最近読んだ書',old:'旧約聖書',next:'新約聖書',empty:'一致する書がありません',close:'書の選択を閉じる'},zh:{title:'选择书卷',search:'输入书卷名称或简称',recent:'最近阅读',old:'旧约',next:'新约',empty:'未找到书卷',close:'关闭书卷选择'}};
export function filterBooks(books,query){const term=normalize(query);return books.filter(book=>!term||[book.name,...bookSearchAliases(book.id)].some(alias=>normalize(alias).includes(term)));}
export function bookPicker(getContext){
 const $=id=>document.getElementById(id),select=$('book'),toggle=$('open-book'),dialog=$('book-picker-dialog'),input=$('book-query'),results=$('book-results');
 let recent=[],composing=false;try{recent=JSON.parse(localStorage.getItem('vible-recent-books')||'[]');if(!Array.isArray(recent))recent=[];}catch{}
 const c=()=>copy[getContext().language];const books=()=>Array.from(select.options,option=>({id:option.value,name:option.textContent}));
 function choose(id){select.value=id;dialog.close();select.dispatchEvent(new Event('change'));}
 function group(title,items){if(!items.length)return;const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');heading.textContent=title;grid.className='book-grid';for(const book of items){const button=document.createElement('button');button.type='button';button.textContent=book.name;button.setAttribute('aria-pressed',String(book.id===getContext().bookId));button.onclick=()=>choose(book.id);grid.append(button);}section.append(heading,grid);results.append(section);}
 function render(){results.replaceChildren();const all=books(),found=filterBooks(all,input.value),split=all.findIndex(book=>book.id==='matthew'),old=new Set(all.slice(0,Math.max(0,split)).map(book=>book.id));
  if(!input.value.trim())group(c().recent,recent.slice(0,3).map(id=>all.find(book=>book.id===id)).filter(Boolean));
  group(c().old,found.filter(book=>old.has(book.id)));group(c().next,found.filter(book=>!old.has(book.id)));
  if(!found.length){const empty=document.createElement('p');empty.className='book-empty';empty.textContent=c().empty;results.append(empty);}
 }
 function position(){if(!dialog.open)return;const rect=toggle.getBoundingClientRect(),width=Math.min(380,innerWidth-16);dialog.style.width=`${width}px`;dialog.style.left=`${Math.max(8,Math.min(rect.left,innerWidth-width-8))}px`;dialog.style.top=`${rect.bottom+8}px`;dialog.style.maxHeight=`${Math.max(150,(window.visualViewport?.height||innerHeight)-rect.bottom-16)}px`;}
 toggle.onclick=()=>{if(select.disabled)return;$('book-picker-title').textContent=c().title;input.placeholder=c().search;input.setAttribute('aria-label',c().search);$('close-book-picker').setAttribute('aria-label',c().close);input.value='';render();dialog.showModal();position();toggle.setAttribute('aria-expanded','true');input.focus();};
 $('close-book-picker').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{const rect=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))dialog.close();});
 input.addEventListener('input',render);input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;render();});
 input.addEventListener('keydown',e=>{if(e.isComposing||composing)return;if(e.key==='ArrowDown'||e.key==='Enter'){const items=results.querySelectorAll('button');if(items.length){e.preventDefault();if(e.key==='Enter'&&items.length===1)items[0].click();else items[0].focus();}}});
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.isComposing){e.preventDefault();dialog.close();}});window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);
 new MutationObserver(()=>{toggle.disabled=select.disabled;}).observe(select,{attributes:true,attributeFilter:['disabled']});
 return {localize(){const context=getContext(),name=Array.from(select.options).find(option=>option.value===context.bookId)?.textContent||'';$('selected-book-name').textContent=name;toggle.title=name;toggle.setAttribute('aria-label',`${c().title}: ${name}`);recent=[context.bookId,...recent.filter(id=>id!==context.bookId)].slice(0,6);try{localStorage.setItem('vible-recent-books',JSON.stringify(recent));}catch{}}};
}
