import {annotations} from './annotations.js';
import './install.js';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const preview=new URLSearchParams(location.search).has('preview');
let data,bookId='john',loadVersion=0,current=0,view='read',scrollFrame=0,fontSize=19,manual=false;
const notes=annotations(()=>({data,bookId}));
const johnChapterNames=['말씀과 첫 만남','가나의 표적과 성전','거듭남과 하나님의 사랑','사마리아의 우물, 생수','베데스다와 생명의 권세','오병이어와 생명의 떡','초막절과 생수의 약속','빛과 자유, 예수님의 증언','보게 된 사람의 증언','선한 목자와 양의 음성','나사로, 부활과 생명','예루살렘에 오시는 왕','끝까지 사랑하신 마지막 식탁','길과 진리, 보혜사와 평안','포도나무와 가지, 사랑','근심에서 기쁨으로','하나 됨을 위한 기도','동산의 체포와 관정의 질문','십자가와 새 무덤','부활의 아침과 믿음','바닷가의 식탁, 다시 따르라'];
const reference=s=>`${data.book} ${s.chapter}:${s.first}${s.last===s.first?'':`–${s.last}`}`;
const image=s=>`assets/${s.image}`;
function showView(next){view=next;window.scrollTo({top:0,behavior:'instant'});for(const key of ['read','story','gallery']){$(`${key==='read'?'reading':key}-view`).hidden=key!==next;const b=$(`${key}-tab`);if(key===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}document.body.classList.remove('immersive');$('focus').hidden=next!=='read';}
function remember(){if(preview||!data)return;try{localStorage.setItem(`visual-bible-${bookId}`,String(data.scenes[current].id));const s=data.scenes[current];localStorage.setItem(`vible-position-${bookId}`,JSON.stringify({chapter:s.chapter,verse:s.first}));}catch{}}
function updateScene(index){
 if(index<0||index>=data.scenes.length)return;
 current=index;const s=data.scenes[index];
 $('chapter').value=String(s.chapter);$('chapter-title').textContent=`${data.book} ${s.chapter}장`;
 $('previous-chapter').disabled=s.chapter===1;$('next-chapter').disabled=s.chapter===data.chapters;
 $('current-reference').textContent=reference(s);$('current-title').textContent=s.title;
 $('scene-position').textContent=`${pad(index+1)} / ${data.sceneCount}`;
 $('progress').style.width=`${(index+1)/data.sceneCount*100}%`;
 $('previous').disabled=index===0;$('next').disabled=index===data.scenes.length-1;
 $('visual').alt=`${reference(s)} · ${s.title}`;
 $('visual').src=image(s);$('visual').style.animation='none';void $('visual').offsetWidth;$('visual').style.animation='';
 $('visual').onerror=()=>{$('image-loading').hidden=false;};$('visual').onload=()=>{$('image-loading').hidden=true;};
 $('explanation').textContent=s.kind==='recollection'?'본문에서 회상하거나 인용하는 과거 이야기를 그렸습니다. 현재 대화 현장의 사건과 구분해 읽어 주세요.':s.kind==='vision'?'본문에 기록된 환상을 시각적으로 표현했습니다. 인물의 실제 주변 풍경과 구분해 읽어 주세요.':s.kind==='metaphor'?'이 장면은 본문의 비유·가르침을 시각적으로 표현했습니다. 실제 사건의 모습과 구분해 읽어 주세요.':'본문의 인물·장소·행동을 바탕으로 그린 장면입니다. 의복과 건물, 인물의 모습은 이해를 위한 시각적 해석입니다.';
 $('bible-source').href=s.source;
 document.querySelectorAll('.passage').forEach(p=>p.classList.toggle('active',Number(p.dataset.id)===s.id));
 remember();
 // Warm only neighboring assets, rather than downloading the whole book.
 for(const neighbor of [index-1,index+1])if(data.scenes[neighbor]){const pre=new Image();pre.src=image(data.scenes[neighbor]);}
}
function renderBook(){
 const fragment=document.createDocumentFragment();let chapter=0;
 for(const s of data.scenes){
  const section=document.createElement('section');section.className='passage';section.dataset.id=s.id;
  if(s.chapter!==chapter){chapter=s.chapter;const marker=document.createElement('h2');marker.className='chapter-marker';marker.textContent=`${data.book} ${chapter}장`;section.append(marker);}
  const heading=document.createElement('h3');heading.textContent=`${s.first}–${s.last}절 · ${s.title}`;section.append(heading);
  for(const v of s.verses){const p=document.createElement('p');p.dataset.chapter=s.chapter;p.dataset.verse=v.verse;const num=document.createElement('button');num.className='verse-number';num.textContent=v.verse;num.setAttribute('aria-label',`${s.chapter}장 ${v.verse}절 선택`);const text=document.createElement('span');text.className='verse-text';text.textContent=v.text;p.append(num,text);section.append(p);}
  fragment.append(section);
 }
 const end=document.createElement('p');end.className='book-end';end.textContent=`${data.book}의 마지막 말씀까지 읽었습니다.`;fragment.append(end);
 $('reader').replaceChildren(fragment);
}
function goTo(index){
 if(index<0||index>=data.scenes.length)return;
 showView('read');manual=true;
 updateScene(index);
 const section=$('reader').querySelector(`[data-id="${data.scenes[index].id}"]`);
 $('reader').scrollTo({top:section.offsetTop-$('reader').offsetTop-12,behavior:'instant'});
 requestAnimationFrame(()=>{manual=false;});
}
function scrollScene(){
 if(manual||view!=='read')return;
 cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{
 const root=$('reader').getBoundingClientRect();const probe=root.top+Math.min(100,root.height*.25);
 let chosen=$('reader').querySelector('.passage');
 for(const section of $('reader').querySelectorAll('.passage')){if(section.getBoundingClientRect().top<=probe)chosen=section;else break;}
 if(chosen){const index=Number(chosen.dataset.id)-1;if(index!==current)updateScene(index);}
 });
}
function card(s){const b=document.createElement('button');b.className='gallery-card';b.setAttribute('aria-label',`${reference(s)} ${s.title}`);const img=document.createElement('img');img.src=image(s);img.alt=s.title;img.loading='lazy';img.width=480;img.height=270;const small=document.createElement('small');small.textContent=reference(s);const title=document.createElement('h2');title.textContent=s.title;b.append(img,small,title);b.addEventListener('click',()=>goTo(s.id-1));return b;}
function renderGallery(){const chapter=Number($('gallery-chapter').value);const term=$('search').value.trim().toLocaleLowerCase();const selected=data.scenes.filter(s=>(!chapter||s.chapter===chapter)&&(!term||`${reference(s)} ${s.title} ${s.verses.map(v=>v.text).join(' ')}`.toLocaleLowerCase().includes(term)));$('gallery').replaceChildren(...selected.map(card));$('result-count').textContent=`${selected.length}개 장면`;$('empty').hidden=selected.length>0;}
function renderStory(){
 const johnArcs=[{chapters:'1장',title:'말씀과 빛',copy:'우리 가운데 오신 말씀. 첫 증인들과 첫 제자들의 만남.',chapter:1},{chapters:'2–12장',title:'만남과 표적',copy:'일상의 갈증과 질문 속에서 드러나는 예수님의 정체와 생명.',chapter:4},{chapters:'13–17장',title:'끝까지 사랑',copy:'마지막 식탁, 섬김과 사랑, 떠나심의 약속과 하나 됨의 기도.',chapter:13},{chapters:'18–21장',title:'십자가와 부활',copy:'자신을 내어주신 분, 다시 찾아오신 분, 다시 따르는 사람들.',chapter:20}];
 const arcs=bookId==='acts'?books.acts.arcs:johnArcs;
 $('story-arcs').replaceChildren(...arcs.map(a=>{const s=data.scenes.find(s=>s.chapter===(a.imageChapter||a.chapter));const b=document.createElement('button');b.className='arc-card';const img=document.createElement('img');img.src=image(s);img.alt=s.title;img.loading='lazy';const copy=document.createElement('div');copy.className='arc-copy';const small=document.createElement('small');small.textContent=a.chapters;const h=document.createElement('h2');h.textContent=a.title;const p=document.createElement('p');p.textContent=a.copy;copy.append(small,h,p);b.append(img,copy);b.addEventListener('click',()=>goTo(data.scenes.findIndex(scene=>scene.chapter===a.chapter)));return b;}));
 $('chapter-map').replaceChildren(...(bookId==='acts'?books.acts.chapterNames:johnChapterNames).map((name,i)=>{const scenes=data.scenes.filter(s=>s.chapter===i+1);const b=document.createElement('button');b.className='chapter-card';const n=document.createElement('span');n.className='chapter-number';n.textContent=pad(i+1);const d=document.createElement('div');const h=document.createElement('h3');h.textContent=name;const p=document.createElement('p');p.textContent=`${scenes.length}개 맥락 · ${scenes.reduce((n,s)=>n+s.verses.length,0)}절`;d.append(h,p);b.append(n,d);b.addEventListener('click',()=>goTo(scenes[0].id-1));return b;}));
}
const books={
 john:{name:'요한복음',english:'THE GOSPEL OF JOHN',storyTitle:'생명을 향한 한 권의 여정',storyCopy:'말씀과 빛으로 시작해, 믿고 생명을 얻는 이야기로 이어집니다.',context:'요한복음은 예수님이 누구신지, 그분을 믿는 것이 어떤 생명으로 이어지는지를 만남과 표적, 말씀과 십자가, 부활을 통해 증언합니다.',search:'우물, 사랑, 생명…',plan:'image-plan.json'},
 acts:{name:'사도행전',english:'THE ACTS OF THE APOSTLES',storyTitle:'예루살렘에서 땅 끝까지',storyCopy:'성령으로 시작된 증언이 경계를 넘어, 로마의 열린 집까지 이어집니다.',context:'사도행전은 누가복음에 이어, 부활하신 예수님의 증인들이 성령의 인도하심을 따라 예루살렘과 유대, 사마리아를 넘어 여러 민족에게 복음을 전하는 여정을 보여 줍니다.',search:'성령, 루디아, 바울, 로마…',plan:'acts-image-plan.json',
 chapterNames:['승천과 증인의 부르심','오순절과 함께 나누는 교회','미문에서 일어난 사람','담대한 증언과 한마음의 기도','사람보다 하나님께 순종','일곱 섬김의 사람과 스데반','스데반의 증언과 마지막 기도','사마리아와 광야 길의 만남','사울의 회심과 다비다의 회복','고넬료의 집, 이방인에게 열린 문','안디옥의 그리스도인들','옥문을 여신 하나님','안디옥에서 시작한 첫 여정','루스드라의 표적과 환난','예루살렘의 의논과 은혜','루디아, 감옥의 찬송과 간수','베뢰아의 말씀, 아덴의 질문','고린도와 브리스길라·아굴라','에베소에서 일어난 변화와 소동','밀레도의 눈물과 맡겨진 양 떼','예루살렘으로 돌아온 바울','계단 위의 증언과 로마 시민권','로마를 향한 약속과 밤의 호송','벨릭스 앞의 부활의 소망','가이사에게 호소한 바울','아그립바 앞의 증언','풍랑 속에서도 잃지 않은 소망','멜리데와 로마, 금하지 못한 말씀'],
 arcs:[{chapters:'1–7장',title:'예루살렘의 증인들',copy:'성령의 약속과 오순절, 나누는 공동체와 박해 속의 증언.',chapter:1,imageChapter:2},{chapters:'8–12장',title:'경계를 넘어선 복음',copy:'사마리아, 에디오피아 관원, 사울과 고넬료, 안디옥의 공동체.',chapter:8},{chapters:'13–20장',title:'여러 민족을 향한 여정',copy:'바울과 동역자들의 항해, 도시마다 열린 만남과 말씀.',chapter:13,imageChapter:16},{chapters:'21–28장',title:'결박 너머로 열린 길',copy:'예루살렘과 가이사랴의 재판, 풍랑과 멜리데, 로마의 열린 집.',chapter:21,imageChapter:27}]}
};
async function loadBook(id){
 if(!books[id])id='john';
 const version=++loadVersion;
 $('book').disabled=true;remember();cancelAnimationFrame(scrollFrame);
 try{
 const response=await fetch(`data/${id}.json`);if(!response.ok)throw Error('성경 본문을 불러오지 못했습니다.');const next=await response.json();
 if(version!==loadVersion)return;
 data=next;bookId=id;current=0;document.body.dataset.book=id;const config=books[id];
 $('book').value=id;document.title=`Vible — 비주얼 바이블 · ${data.book}`;
 $('reading-book-label').textContent=config.english;$('reading-book-title').textContent=data.book;
 $('chapter').setAttribute('aria-label',`${data.book} 장 선택`);
 for(const select of ['chapter','gallery-chapter']){
 $(select).replaceChildren();
 if(select==='gallery-chapter')$(select).append(new Option('전체','0'));
 for(let c=1;c<=data.chapters;c++)$(select).append(new Option(`${c}장`,String(c)));
 }
 $('gallery-description').textContent=`${data.chapters}장, ${data.verseCount.toLocaleString()}절을 ${data.sceneCount}개의 맥락으로 따라 읽습니다.`;
 $('gallery-title').textContent=`장면으로 보는 ${data.book}`;
 $('story-title').textContent=config.storyTitle;$('story-copy').textContent=config.storyCopy;$('book-context').textContent=config.context;
 $('chapter-map-title').textContent=`${data.chapters}장의 흐름`;
 $('search').value='';$('search').placeholder=config.search;
 $('prompt-source').href=config.plan;$('prompt-source').textContent=`${data.sceneCount}장 제작 프롬프트 ↗`;
 $('source-notes').textContent=id==='john'?'비유와 가르침을 그린 장면은 설명에서 구분합니다. 요한복음 5:3–4와 7:53–8:11의 본문 괄호도 원본대로 유지했습니다.':'환상과 설교 속 과거 이야기는 장면 설명에서 구분합니다. 사도행전의 (없음) 및 [25절과 같음] 표기도 전자 본문 원본대로 유지했습니다.';
 $('explanation').hidden=true;$('error').hidden=true;
 renderBook();notes.refresh();renderStory();renderGallery();
 let saved=0;try{if(!preview){saved=Number(localStorage.getItem(`visual-bible-${id}`))-1;const position=JSON.parse(localStorage.getItem(`vible-position-${id}`)||'null');if(position)saved=data.scenes.findIndex(s=>s.chapter===position.chapter&&s.first<=position.verse&&s.last>=position.verse);localStorage.setItem('visual-bible-book',id);}}catch{}
 const params=new URLSearchParams(location.search);const linked=params.get('book')===id?data.scenes.findIndex(s=>s.chapter===Number(params.get('chapter'))&&s.first<=Number(params.get('verse'))&&s.last>=Number(params.get('verse'))):-1;goTo(linked>=0?linked:Number.isInteger(saved)&&saved>=0&&saved<data.scenes.length?saved:0);
 }finally{if(version===loadVersion)$('book').disabled=false;}
}
async function init(){
 $('book').addEventListener('change',()=>loadBook($('book').value).catch(showError));
 for(const key of ['read','story','gallery'])$(`${key}-tab`).addEventListener('click',()=>{$('navigation-dialog').close();showView(key);if(key==='gallery')renderGallery();});
 $('open-menu').onclick=()=>$('navigation-dialog').showModal();$('close-menu').onclick=()=>$('navigation-dialog').close();
 for(const [id,step] of [['previous-chapter',-1],['next-chapter',1]])$(id).onclick=()=>{if(data&&!$('book').disabled){const chapter=Number($('chapter').value)+step;const index=data.scenes.findIndex(s=>s.chapter===chapter);if(index>=0)goTo(index);}};
 $('notes-tab').onclick=()=>{
  $('navigation-dialog').close();$('saved-notes-book').textContent=data.book;
  let saved={};try{saved=JSON.parse(localStorage.getItem(`vible-notes-${bookId}`)||'{}')||{};}catch{}
  const entries=data.scenes.flatMap(s=>s.verses.map(v=>({scene:s,verse:v,record:saved[`${s.chapter}:${v.verse}`]}))).filter(e=>e.record?.highlight||e.record?.note);
  const cards=entries.map(({scene,verse,record})=>{const b=document.createElement('button');b.className='saved-note';const ref=document.createElement('strong');ref.textContent=`${data.book} ${scene.chapter}:${verse.verse}${record.highlight?' · 하이라이트':''}`;const text=document.createElement('span');text.textContent=verse.text;b.append(ref,text);if(record.note){const note=document.createElement('p');note.textContent=record.note;b.append(note);}b.onclick=()=>{$('saved-notes-dialog').close();goTo(scene.id-1);notes.editVerse(scene.chapter,verse.verse);};return b;});
  if(!cards.length){const empty=document.createElement('p');empty.textContent='아직 저장한 말씀이 없습니다. 말씀을 선택해 하이라이트나 묵상을 남겨 보세요.';cards.push(empty);}
  $('saved-notes-list').replaceChildren(...cards);$('saved-notes-dialog').showModal();
 };
 $('close-saved-notes').onclick=()=>$('saved-notes-dialog').close();
 $('install').addEventListener('click',()=>$('navigation-dialog').close());
 $('chapter').addEventListener('change',()=>goTo(data.scenes.findIndex(s=>s.chapter===Number($('chapter').value))));
 $('gallery-chapter').addEventListener('change',renderGallery);$('search').addEventListener('input',renderGallery);
 $('reader').addEventListener('scroll',scrollScene,{passive:true});$('previous').addEventListener('click',()=>goTo(current-1));$('next').addEventListener('click',()=>goTo(current+1));
 $('explain').addEventListener('click',()=>{$('explanation').hidden=!$('explanation').hidden;});
 $('source-button').addEventListener('click',()=>$('source-dialog').showModal());$('close-source').addEventListener('click',()=>$('source-dialog').close());
 function setFont(size){
  fontSize=Math.max(16,Math.min(31,Number(size)||19));
  const reader=$('reader'),top=reader.getBoundingClientRect().top;
  const anchor=[...reader.querySelectorAll('[data-verse]')].find(p=>p.getBoundingClientRect().bottom>top);
  const offset=anchor?anchor.getBoundingClientRect().top-top:0;
  document.documentElement.style.setProperty('--body-size',`${fontSize}px`);
  if(anchor)reader.scrollTop+=anchor.getBoundingClientRect().top-top-offset;
  $('font-size').textContent=`글자 크기 ${fontSize}`;
  $('font-smaller').disabled=fontSize===16;$('font-larger').disabled=fontSize===31;
  try{localStorage.setItem('vible-font-size',String(fontSize));}catch{}
 }
 let storedFont;try{storedFont=Number(localStorage.getItem('vible-font-size'));}catch{}
 setFont(storedFont>=16&&storedFont<=31?storedFont:19);
 $('font-smaller').onclick=()=>setFont(fontSize-1);$('font-larger').onclick=()=>setFont(fontSize+1);
 $('focus').addEventListener('click',()=>{$('navigation-dialog').close();document.body.classList.toggle('immersive');});
 $('exit-focus').onclick=()=>document.body.classList.remove('immersive');
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||document.querySelector('dialog[open]'))return;if(e.key==='Escape')document.body.classList.remove('immersive');if(view==='read'&&e.key==='ArrowRight'){e.preventDefault();goTo(current+1);}if(view==='read'&&e.key==='ArrowLeft'){e.preventDefault();goTo(current-1);}});
 let initial=new URLSearchParams(location.search).get('book');try{if(!initial&&!preview)initial=localStorage.getItem('visual-bible-book');}catch{}await loadBook(initial||'john');
}
function showError(e){$('error').hidden=false;$('error').textContent=e.message;if(data)$('book').value=bookId;}
init().catch(showError);
