import {proverbsBooks} from './proverbs-catalog.js';
import {assetURL} from './assets.js';
import {initialLanguage,normalizeLanguage,languageNames,bookNames,messages,applyTranslation,interfaceCopy} from './languages.js';
import {epistleBooks} from './epistles-catalog.js';
import {pentateuchBooks} from './pentateuch-catalog.js';
import {psalmsBooks} from './psalms-catalog.js';
import {historicalBooks} from './historical-catalog.js';
import {renderScripture} from './jesus-words.js';
import {annotations} from './annotations.js';
import {scriptureSearch} from './search-ui.js';
import {bookPicker} from './book-picker.js';
import {sceneFeedback} from './feedback.js';
import {isNative,SITE_ORIGIN,fetchContent} from './platform.js';
import {text,localizeDocument} from './i18n.js';
import {offlineImages,offlineImageURL} from './image-cache.js';
import {localizeInstall} from './install.js';
const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const preview=new URLSearchParams(location.search).has('preview');
let data,bookId='john',loadVersion=0,current=0,view='read',scrollFrame=0,fontSize=19,manual=false;
let language='ko',catalog={ko:{books:[]}},preferredLanguage='ko';
const picker=bookPicker(()=>({bookId,language}));
const ui=()=>messages[language];
const t=()=>text(language);
const notes=annotations(()=>({data,bookId,language}));
$('share-scene').onclick=()=>notes.shareScene(data.scenes[current]);
const feedback=sceneFeedback(()=>({bookId,language,scene:data?.scenes[current],reference:data?reference(data.scenes[current]):''}));
const search=scriptureSearch(()=>({ready:Boolean(data),bookId,language,name:data?.book||bookNames[language][bookId]}),async verse=>{
 if(bookId!==verse.book||language!==verse.language)await loadBook(verse.book,verse.language,true);
 const index=data.scenes.findIndex(s=>s.chapter===verse.chapter&&s.first<=verse.verse&&s.last>=verse.verse);
 if(index<0)throw Error('Verse unavailable');goTo(index);
 const paragraph=$('reader').querySelector(`p[data-chapter="${verse.chapter}"][data-verse="${verse.verse}"]`);
 $('reader').querySelectorAll('.search-target').forEach(p=>p.classList.remove('search-target'));if(paragraph)paragraph.classList.add('search-target');
 if(paragraph)$('reader').scrollTo({top:$('reader').scrollTop+paragraph.getBoundingClientRect().top-$('reader').getBoundingClientRect().top-24,behavior:'instant'});
 const url=new URL(location.href);url.searchParams.set('book',bookId);url.searchParams.set('chapter',verse.chapter);url.searchParams.set('verse',verse.verse);url.searchParams.set('lang',language);url.searchParams.set('read','1');history.replaceState(null,'',url);
});
const johnChapterNames=['말씀과 첫 만남','가나의 표적과 성전','거듭남과 하나님의 사랑','사마리아의 우물, 생수','베데스다와 생명의 권세','오병이어와 생명의 떡','초막절과 생수의 약속','빛과 자유, 예수님의 증언','보게 된 사람의 증언','선한 목자와 양의 음성','나사로, 부활과 생명','예루살렘에 오시는 왕','끝까지 사랑하신 마지막 식탁','길과 진리, 보혜사와 평안','포도나무와 가지, 사랑','근심에서 기쁨으로','하나 됨을 위한 기도','동산의 체포와 관정의 질문','십자가와 새 무덤','부활의 아침과 믿음','바닷가의 식탁, 다시 따르라'];
const reference=s=>`${data.book} ${s.chapter}:${s.first}${s.last===s.first?'':`–${s.last}`}`;
const image=s=>assetURL(s.image);
function showView(next){view=next;window.scrollTo({top:0,behavior:'instant'});for(const key of ['read','story','gallery']){$(`${key==='read'?'reading':key}-view`).hidden=key!==next;const b=$(`${key}-tab`);if(key===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}document.body.classList.remove('image-only');$('focus').setAttribute('aria-pressed','false');$('focus').setAttribute('aria-label',interfaceCopy[language].hideText);$('focus').title=interfaceCopy[language].hideText;$('focus').hidden=next!=='read';}
function remember(){if(preview||!data)return;try{localStorage.setItem(`visual-bible-${bookId}`,String(data.scenes[current].id));const s=data.scenes[current];localStorage.setItem(`vible-position-${bookId}`,JSON.stringify({chapter:s.chapter,verse:s.first}));}catch{}}
function loadSceneImage(s,force=false){
 const img=$('visual'),status=$('image-loading'),src=image(s);
 if(!force&&(img.dataset?.source||img.getAttribute('src'))===src)return;
 const copy={ko:['그림을 불러오는 중입니다','그림을 불러오지 못했습니다','다시 시도'],en:['Loading image','Image could not load','Retry'],ja:['画像を読み込み中','画像を読み込めませんでした','再試行'],zh:['正在加载图片','图片加载失败','重试']}[language];
 status.textContent=copy[0];status.hidden=Boolean(s.imagePending);
 img.onload=()=>{status.hidden=true;};
 img.onerror=()=>{if(s.imagePending)return;status.hidden=false;status.textContent=copy[1]+' ';const retry=document.createElement('button');retry.textContent=copy[2];retry.onclick=()=>loadSceneImage(s,true);status.append(retry);};
 if(force)img.removeAttribute('src');
 if(offlineImages){img.dataset.source=src;offlineImageURL(src).then(url=>{if(img.dataset.source===src)img.src=url;});}else img.src=src;
 if(img.complete&&img.naturalWidth)status.hidden=true;
}
function updateScene(index){
 if(index<0||index>=data.scenes.length)return;
 current=index;const s=data.scenes[index];
 $('chapter-title').textContent=`${data.book} ${ui().chapter(s.chapter)}`;
 $('reader-chapter').textContent=ui().chapter(s.chapter);
 for(const [id,target] of [['reader-previous-chapter',s.chapter-1],['reader-next-chapter',s.chapter+1]]){
  const button=$(id),available=target>=1&&target<=data.chapters;
  button.disabled=!available;
  button.querySelector('.chapter-target').textContent=available?ui().chapter(target):(target<1?t().firstChapter:t().lastChapter);
  button.setAttribute('aria-label',available?t().goToChapter(target):(target<1?t().noPreviousChapter:t().noNextChapter));
  button.title=available?t().goToChapterStart(target):(target<1?t().atFirstChapter:t().atLastChapter);
 }
 const shareLabel=({ko:'이 장면 말씀 공유',en:'Share this scene',ja:'この場面を共有',zh:'分享这个场景'})[language];$('share-scene').setAttribute('aria-label',shareLabel);$('share-scene').title=shareLabel;
 feedback.localize();
 $('current-reference').textContent=reference(s);$('current-title').textContent=s.title;
 $('scene-position').textContent=`${pad(index+1)} / ${data.sceneCount}`;
 $('image-pending').hidden=!s.imagePending;
 $('translation-edition').textContent=data.translation;
 const progress=$('progress');progress.max=data.scenes.length-1;progress.value=index;progress.disabled=data.scenes.length<2;progress.style.setProperty('--scene-progress',`${data.scenes.length>1?index/(data.scenes.length-1)*100:0}%`);progress.setAttribute('aria-valuetext',`${reference(s)} · ${index+1} / ${data.scenes.length}`);progress.setAttribute('aria-label',({ko:'장면 이동',en:'Go to scene',ja:'場面を移動',zh:'切换场景'})[language]);
 $('previous').disabled=index===0;$('next').disabled=index===data.scenes.length-1;
 $('visual').alt=`${reference(s)} · ${s.title}`;
 $('visual').dataset.book=bookId;$('visual').dataset.layout=s.image.includes('-right-')?'right':'';$('visual-stage').dataset.layout=$('visual').dataset.layout;loadSceneImage(s);$('visual').style.animation='none';void $('visual').offsetWidth;$('visual').style.animation='';
 $('explanation').textContent=bookId==='proverbs'?'잠언의 가르침과 비유를 시각적으로 표현했습니다. 그림은 본문에 기록된 실제 사건의 재현을 뜻하지 않습니다.':bookId==='psalms'?(s.kind==='recollection'?'시에서 되돌아보는 구원의 역사를 그렸습니다. 시를 부르는 현재의 사건과 구분해 읽어 주세요.':'시의 감정과 기도, 비유를 시각적으로 표현했습니다. 그림은 실제 사건의 재현을 뜻하지 않습니다.') :s.kind==='recollection'?'본문에서 회상하거나 인용하는 과거 이야기를 그렸습니다. 현재 대화 현장의 사건과 구분해 읽어 주세요.':s.kind==='vision'?'본문에 기록된 꿈과 환상을 시각적으로 표현했습니다. 인물의 실제 주변 풍경과 구분해 읽어 주세요.':s.kind==='metaphor'?(bookId==='genesis'&&s.chapter<=3?'창조와 에덴의 서술을 이해하도록 구성한 시각화입니다. 과학적 시간표나 실제 장소의 확정된 복원으로 제시하지 않습니다.':'이 장면은 본문의 비유·가르침을 시각적으로 표현했습니다. 실제 사건의 모습과 구분해 읽어 주세요.'):s.kind==='editorial'?(['genesis',...Object.keys(pentateuchBooks),...Object.keys(historicalBooks),'matthew','mark','luke'].includes(bookId)?'족보와 여러 세대, 서술의 여백을 이해하도록 구성한 장면입니다. 본문에 없는 실제 사건으로 단정하지 않습니다.':'편지에 담긴 인물·인사·계획을 이해하도록 구성한 장면입니다. 본문에 기록된 실제 현장의 재현이나 여행의 실현을 뜻하지 않습니다.'):'본문의 인물·장소·행동을 바탕으로 그린 장면입니다. 의복과 건물, 인물의 모습은 이해를 위한 시각적 해석입니다.';
 $('bible-source').href=s.source;
 if(language!=='ko')$('explanation').textContent='';
 document.querySelectorAll('.passage').forEach(p=>p.classList.toggle('active',Number(p.dataset.id)===s.id));
 remember();
 // Warm only neighboring assets, rather than downloading the whole book.
 for(const neighbor of [index-1,index+1])if(data.scenes[neighbor]){const pre=new Image();pre.crossOrigin='anonymous';pre.src=image(data.scenes[neighbor]);}
}
function renderBook(){
 const fragment=document.createDocumentFragment();let chapter=0;
 for(const s of data.scenes){
  const section=document.createElement('section');section.className='passage';section.dataset.id=s.id;
  if(s.chapter!==chapter){chapter=s.chapter;const marker=document.createElement('h2');marker.className='chapter-marker';marker.textContent=`${data.book} ${ui().chapter(chapter)}`;section.append(marker);}
  const heading=document.createElement('h3');heading.textContent=`${t().verseRange(s.first,s.last)} · ${s.title}`;section.append(heading);
  for(const v of s.verses){if(v.omitted)continue;const p=document.createElement('p');p.dataset.chapter=s.chapter;p.dataset.verse=v.verse;if(v.endVerse)p.dataset.endVerse=v.endVerse;const num=document.createElement('button');num.className='verse-number';num.textContent=v.endVerse?`${v.verse}–${v.endVerse}`:v.verse;num.setAttribute('aria-label',ui().selectVerse(s.chapter,v.verse));const text=document.createElement('span');text.className='verse-text';renderScripture(text,bookId,s.chapter,v.verse,language,v.text);p.append(num,text);section.append(p);}
  fragment.append(section);
 }
 const end=document.createElement('p');end.className='book-end';end.textContent=`${data.book} · ${ui().end}`;const next=nextBookId();if(next){const hint=document.createElement('span');hint.className='next-book-hint';hint.textContent=({ko:`마지막 말씀을 지나 아래로 세 번 더 스크롤하면 ${bookNames[language][next]||books[next].name}로 이어집니다.`,en:`After the last verse, scroll down three more times to continue to ${bookNames[language][next]||books[next].name}.`,ja:`最後の節を通り過ぎてから、さらに3回下にスクロールすると${bookNames[language][next]||books[next].name}へ進みます。`,zh:`最后一节移出屏幕后，再向下滚动三次，继续阅读${bookNames[language][next]||books[next].name}。`})[language];end.append(hint);}fragment.append(end);
 $('reader').replaceChildren(fragment);
}
function goTo(index){
 if(index<0||index>=data.scenes.length)return;
 showView('read');manual=true;
 updateScene(index);
 const section=$('reader').querySelector(`[data-id="${data.scenes[index].id}"]`);
 const reader=$('reader');
 const align=()=>{reader.scrollTo({top:reader.scrollTop+section.getBoundingClientRect().top-reader.getBoundingClientRect().top-12,behavior:'instant'});return reader.scrollTop;};
 let placed=align();
 requestAnimationFrame(()=>{manual=false;});
 // Late layout (fonts, the image stage, a restored text size) can shift the text after a cold start; re-align until the reader scrolls.
 const settle=()=>{if(current!==index||!section.isConnected||Math.abs(reader.scrollTop-placed)>2)return;if(Math.abs(section.getBoundingClientRect().top-reader.getBoundingClientRect().top-12)>2){manual=true;placed=align();requestAnimationFrame(()=>{manual=false;});}};
 document.fonts?.ready.then(settle);for(const delay of [120,400,1000])setTimeout(settle,delay);
}
function setupSceneProgress(range,navigate,getIndex){
 let lastWheel=-Infinity;
 range.addEventListener('input',()=>navigate(Number(range.value)));
 range.addEventListener('wheel',e=>{
  if(e.ctrlKey||range.disabled)return;
  const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
  if(!delta)return;e.preventDefault();
  const now=performance.now();if(now-lastWheel<160)return;lastWheel=now;
  navigate(Math.max(Number(range.min),Math.min(Number(range.max),getIndex()+Math.sign(delta))));
 },{passive:false});
}
function nextBookId(){
 const ids=Array.from($('book').options,option=>option.value);
 return ids[ids.indexOf(bookId)+1];
}
async function continueToNextBook(){
 const id=nextBookId();if(!id||$('book').disabled)return;
 const nextLanguage=catalog[preferredLanguage]?.books.includes(id)?preferredLanguage:catalog[language]?.books.includes(id)?language:'ko';
 await loadBook(id,nextLanguage,true);
 if(bookId!==id)return;
 const url=new URL(location.href);url.searchParams.set('book',id);url.searchParams.set('chapter','1');url.searchParams.set('verse','1');url.searchParams.set('lang',language);history.replaceState(null,'',url);
}
function setupBookContinuation(reader,canContinue,navigate){
 let lastWheel=-Infinity,wheelReady=false,wheelDistance=0,touchStart=null,gestures=0;
 const atEnd=()=>{const verse=reader.querySelector('.passage:last-of-type p[data-verse]:last-child');return !!verse&&verse.getBoundingClientRect().bottom<=reader.getBoundingClientRect().top;};
 const advance=()=>{if(++gestures<3)return;gestures=0;navigate();};
 reader.addEventListener('scroll',()=>{if(!atEnd())gestures=0;},{passive:true});
 reader.addEventListener('wheel',event=>{
  const now=performance.now(),fresh=now-lastWheel>300;lastWheel=now;
  if(fresh){wheelReady=atEnd()&&canContinue();wheelDistance=0;}
  if(event.ctrlKey||event.deltaY<=0||Math.abs(event.deltaX)>Math.abs(event.deltaY)){wheelReady=false;if(event.deltaY<0)gestures=0;return;}
  if(!wheelReady||!atEnd()||!canContinue())return;
  wheelDistance+=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?reader.clientHeight:1);if(wheelDistance<40)return;
  wheelReady=false;event.preventDefault();advance();
 },{passive:false});
 reader.addEventListener('touchstart',event=>{
  touchStart=event.touches.length===1&&atEnd()&&canContinue()?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
 },{passive:true});
 reader.addEventListener('touchmove',event=>{if(event.touches.length!==1)touchStart=null;},{passive:true});
 reader.addEventListener('touchend',event=>{
  const start=touchStart;touchStart=null;const touch=event.changedTouches[0];
  if(!start||!touch||!atEnd()||!canContinue())return;
  const distance=start.y-touch.clientY;
  if(distance<0)gestures=0;
  if(distance>=48&&distance>Math.abs(start.x-touch.clientX))advance();
 },{passive:true});
 reader.addEventListener('touchcancel',()=>{touchStart=null;},{passive:true});
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
function card(s){const b=document.createElement('button');b.className='gallery-card';b.setAttribute('aria-label',`${reference(s)} ${s.title}`);const img=document.createElement('img');img.crossOrigin='anonymous';img.src=image(s);img.alt=s.title;img.loading='lazy';img.width=480;img.height=270;const small=document.createElement('small');small.textContent=reference(s);const title=document.createElement('h2');title.textContent=s.title;b.append(img,small,title);b.addEventListener('click',()=>goTo(s.id-1));return b;}
function renderGallery(){const chapter=Number($('gallery-chapter').value);const term=$('search').value.trim().toLocaleLowerCase();const selected=data.scenes.filter(s=>(!chapter||s.chapter===chapter)&&(!term||`${reference(s)} ${s.title} ${s.verses.map(v=>v.text).join(' ')}`.toLocaleLowerCase().includes(term)));$('gallery').replaceChildren(...selected.map(card));$('result-count').textContent=ui().scenes(selected.length);$('empty').hidden=selected.length>0;}
function renderStory(){
 const johnArcs=[{chapters:'1장',title:'말씀과 빛',copy:'우리 가운데 오신 말씀. 첫 증인들과 첫 제자들의 만남.',chapter:1},{chapters:'2–12장',title:'만남과 표적',copy:'일상의 갈증과 질문 속에서 드러나는 예수님의 정체와 생명.',chapter:4},{chapters:'13–17장',title:'끝까지 사랑',copy:'마지막 식탁, 섬김과 사랑, 떠나심의 약속과 하나 됨의 기도.',chapter:13},{chapters:'18–21장',title:'십자가와 부활',copy:'자신을 내어주신 분, 다시 찾아오신 분, 다시 따르는 사람들.',chapter:20}];
 const originalArcs=books[bookId].arcs||johnArcs;
 const arcs=language==='ko'?originalArcs:originalArcs.map(a=>({...a,title:a.chapters.replace(/장/g,''),chapters:ui().story,copy:''}));
 $('story-arcs').replaceChildren(...arcs.map(a=>{const s=data.scenes.find(s=>s.chapter===(a.imageChapter||a.chapter));const b=document.createElement('button');b.className='arc-card';const img=document.createElement('img');img.crossOrigin='anonymous';img.src=image(s);img.alt=s.title;img.loading='lazy';const copy=document.createElement('div');copy.className='arc-copy';const small=document.createElement('small');small.textContent=a.chapters;const h=document.createElement('h2');h.textContent=a.title;const p=document.createElement('p');p.textContent=a.copy;copy.append(small,h,p);b.append(img,copy);b.addEventListener('click',()=>goTo(data.scenes.findIndex(scene=>scene.chapter===a.chapter)));return b;}));
 $('chapter-map').replaceChildren(...(books[bookId].chapterNames||johnChapterNames).map((name,i)=>{const scenes=data.scenes.filter(s=>s.chapter===i+1);const b=document.createElement('button');b.className='chapter-card';const n=document.createElement('span');n.className='chapter-number';n.textContent=pad(i+1);const d=document.createElement('div');const h=document.createElement('h3');h.textContent=language==='ko'?name:ui().chapter(i+1);const p=document.createElement('p');p.textContent=language==='ko'?`${scenes.length}개 맥락 · ${scenes.reduce((n,s)=>n+s.verses.length,0)}절`:ui().scenes(scenes.length);d.append(h,p);b.append(n,d);b.addEventListener('click',()=>goTo(scenes[0].id-1));return b;}));
}
const books={
 '1corinthians':{name:'고린도전서',english:'FIRST CORINTHIANS',storyTitle:'사랑으로 세워지는 공동체',storyCopy:'십자가의 지혜, 한 몸의 은사, 사랑과 부활의 소망.',context:'바울이 고린도 교회에 보내는 편지입니다. 공동체의 갈등과 삶의 질문을 복음과 사랑으로 풀어 갑니다.',search:'사랑, 은사, 부활…',plan:'1corinthians-image-plan.json',chapterNames:["고린도의 성도들에게 은혜와 평강", "말의 화려함보다 십자가", "시기와 분쟁, 아직 자라지 못한 마음", "맡은 자에게 구할 것은 충성", "악을 자랑하지 말고 아파하라", "형제의 다툼을 지혜롭게 풀다", "부부가 서로를 돌보며 합의하다", "지식은 교만하게, 사랑은 세우다", "너희가 사도 됨의 증거", "구름과 바다, 광야의 공급", "본받고 전해 받은 것을 지키다", "성령을 따라 주를 고백하다", "사랑이 없으면 아무것도 아니다", "사랑을 따라 공동체를 세우는 말", "전해 받은 복음 위에 굳게 서다", "성도들을 위한 준비된 연보"],arcs:[{chapters:'1–4장',title:'십자가의 지혜와 공동체',copy:'분열을 넘어 그리스도 안에서 하나로.',chapter:1},{chapters:'5–10장',title:'거룩한 삶과 자유',copy:'서로를 세우는 선택과 사랑.',chapter:5},{chapters:'11–14장',title:'한 몸의 은사와 사랑',copy:'사랑으로 함께 세워지는 교회.',chapter:11},{chapters:'15–16장',title:'부활의 소망',copy:'견고한 소망과 사랑의 인사.',chapter:15}]},

 "matthew": {
  "name": "마태복음",
  "english": "THE GOSPEL OF MATTHEW",
  "storyTitle": "약속의 성취에서 모든 민족을 향한 부르심까지",
  "storyCopy": "왕의 오심과 하나님 나라의 가르침, 긍휼의 만남과 십자가, 함께하신다는 부활의 약속을 따라갑니다.",
  "context": "왕의 오심과 하나님 나라의 가르침, 긍휼의 만남과 십자가, 함께하신다는 부활의 약속을 따라갑니다. 각 복음서의 고유한 순서와 인물, 비유와 실제 만남을 구분해 읽습니다. 그림 속 외모와 의복은 본문 이해를 위한 시각적 해석입니다.",
  "search": "산상수훈, 천국, 용서…",
  "plan": "matthew-image-plan.json",
  "chapterNames": [
   "약속의 계보와 임마누엘",
   "별빛과 피난길",
   "회개와 요단의 순종",
   "시험과 갈릴리의 부르심",
   "복과 빛, 깊어지는 의",
   "숨은 기도와 하늘의 보물",
   "좁은 길과 반석의 집",
   "만남과 치유, 잠잠해진 바다",
   "용서와 회복, 추수의 일꾼",
   "열두 제자를 보내시다",
   "수고한 이들을 부르는 쉼",
   "안식과 긍휼, 새로운 가족",
   "씨앗과 하나님 나라의 비유",
   "떡을 나누고 물 위를 건너다",
   "마음의 정결과 경계를 넘는 믿음",
   "너희는 나를 누구라 하느냐",
   "산 위의 빛과 작은 믿음",
   "작은 이를 돌보는 용서",
   "혼인과 어린아이, 재물의 선택",
   "포도원과 섬김, 두 맹인의 눈",
   "예루살렘에 오시는 왕",
   "초대와 사랑의 큰 계명",
   "겉모습과 마음, 예루살렘의 눈물",
   "깨어 기다리는 사람들",
   "등불과 달란트, 작은 이를 돌보라",
   "마지막 식탁과 겟세마네",
   "십자가와 닫힌 무덤",
   "부활의 아침과 모든 민족"
  ],
  "arcs": [
   {
    "chapters": "1–4장",
    "title": "약속의 오심",
    "copy": "",
    "chapter": 1
   },
   {
    "chapters": "5–7장",
    "title": "하나님 나라의 삶",
    "copy": "",
    "chapter": 5
   },
   {
    "chapters": "8–20장",
    "title": "치유와 제자의 길",
    "copy": "",
    "chapter": 8
   },
   {
    "chapters": "21–25장",
    "title": "예루살렘과 깨어 있는 기다림",
    "copy": "",
    "chapter": 21
   },
   {
    "chapters": "26–28장",
    "title": "십자가와 함께하심의 약속",
    "copy": "",
    "chapter": 26
   }
  ]
 },
 "mark": {
  "name": "마가복음",
  "english": "THE GOSPEL OF MARK",
  "storyTitle": "만남의 현장에서 십자가와 부활의 아침까지",
  "storyCopy": "빠르게 이어지는 치유와 부르심 속에서, 섬기고 자신을 내어주시는 예수님의 길을 따라갑니다.",
  "context": "빠르게 이어지는 치유와 부르심 속에서, 섬기고 자신을 내어주시는 예수님의 길을 따라갑니다. 각 복음서의 고유한 순서와 인물, 비유와 실제 만남을 구분해 읽습니다. 그림 속 외모와 의복은 본문 이해를 위한 시각적 해석입니다.",
  "search": "치유, 섬김, 바디매오…",
  "plan": "mark-image-plan.json",
  "chapterNames": [
   "복음의 시작과 갈릴리의 만남",
   "용서와 식탁, 새로운 시작",
   "안식과 열두 사람, 새로운 가족",
   "씨앗의 비유와 잠잠해진 바다",
   "건너편의 회복과 두 여인의 소망",
   "배척과 보냄, 떡을 나누다",
   "마음의 정결과 열린 귀",
   "떡과 눈, 십자가를 따르는 길",
   "산 위의 빛과 작은 이를 섬김",
   "어린아이와 재물, 바디매오",
   "예루살렘과 성전, 믿음의 기도",
   "포도원과 큰 계명, 과부의 예물",
   "무너짐 속에서도 깨어 있으라",
   "향유와 식탁, 동산의 밤",
   "십자가와 맡겨진 무덤",
   "빈 무덤과 부활의 증언"
  ],
  "arcs": [
   {
    "chapters": "1–3장",
    "title": "다가온 복음과 새로운 가족",
    "copy": "",
    "chapter": 1
   },
   {
    "chapters": "4–8장",
    "title": "두려움을 건너는 믿음",
    "copy": "",
    "chapter": 4
   },
   {
    "chapters": "9–10장",
    "title": "작은 이를 섬기는 길",
    "copy": "",
    "chapter": 9
   },
   {
    "chapters": "11–13장",
    "title": "예루살렘과 깨어 있음",
    "copy": "",
    "chapter": 11
   },
   {
    "chapters": "14–16장",
    "title": "내어주심과 부활의 증언",
    "copy": "",
    "chapter": 14
   }
  ]
 },
 "luke": {
  "name": "누가복음",
  "english": "THE GOSPEL OF LUKE",
  "storyTitle": "잃어버린 이를 찾아 함께 걷는 길",
  "storyCopy": "낮은 자리를 찾아온 기쁨, 경계를 넘는 긍휼과 돌아온 사람들, 십자가와 엠마오의 만남을 따라갑니다.",
  "context": "낮은 자리를 찾아온 기쁨, 경계를 넘는 긍휼과 돌아온 사람들, 십자가와 엠마오의 만남을 따라갑니다. 각 복음서의 고유한 순서와 인물, 비유와 실제 만남을 구분해 읽습니다. 그림 속 외모와 의복은 본문 이해를 위한 시각적 해석입니다.",
  "search": "이웃, 돌아온 아들, 삭개오, 엠마오…",
  "plan": "luke-image-plan.json",
  "chapterNames": [
   "두 가정에 찾아온 약속과 찬송",
   "구유와 목자, 성전에서의 만남",
   "회개와 나눔, 인류를 잇는 계보",
   "시험과 나사렛, 갈릴리의 회복",
   "깊은 데로, 부르심과 새 식탁",
   "열두 사람과 평지의 가르침",
   "백부장과 나인성, 용서의 눈물",
   "씨앗과 바다, 회복과 두 여인",
   "보냄과 산 위의 빛, 예루살렘을 향해",
   "일흔 사람과 이웃, 듣는 마음",
   "기도와 빛, 마음을 살피다",
   "염려를 내려놓고 깨어 기다리라",
   "돌이킴과 회복, 좁은 문",
   "낮은 자리와 열린 잔치",
   "잃어버린 것을 찾는 기쁨",
   "재물과 충성, 부자와 나사로",
   "용서와 믿음, 돌아온 한 사람",
   "기도와 어린아이, 보게 된 사람",
   "삭개오와 예루살렘을 향한 눈물",
   "권위와 포도원, 부활의 질문",
   "과부의 예물과 깨어 기다림",
   "마지막 식탁과 동산, 베드로의 눈물",
   "십자가와 낙원, 안식의 무덤",
   "빈 무덤과 엠마오, 다시 열린 길"
  ],
  "arcs": [
   {
    "chapters": "1–4장",
    "title": "낮은 자리에 찾아온 기쁨",
    "copy": "",
    "chapter": 1
   },
   {
    "chapters": "5–9장",
    "title": "만남과 치유, 제자의 부르심",
    "copy": "",
    "chapter": 5
   },
   {
    "chapters": "10–18장",
    "title": "이웃과 돌아온 사람들",
    "copy": "",
    "chapter": 10
   },
   {
    "chapters": "19–23장",
    "title": "예루살렘을 향한 길과 십자가",
    "copy": "",
    "chapter": 19
   },
   {
    "chapters": "24장",
    "title": "부활과 함께 걸었던 길",
    "copy": "",
    "chapter": 24
   }
  ]
 }
,
 genesis:{name:'창세기',english:'THE BOOK OF GENESIS',storyTitle:'태초의 빛에서 생명을 살리는 화해까지',storyCopy:'좋은 창조와 깨어진 관계, 떠나라는 부르심과 이어지는 약속, 고난을 지나 생명을 살리는 가족의 여정.',context:'창세기는 천지와 사람의 시작에서 아브라함·이삭·야곱·요셉의 가족 이야기로 이어집니다. 창조의 선함과 인간의 실패, 언약과 기다림, 고난 속의 돌보심과 화해를 따라 읽습니다. 그림은 본문의 의미를 돕는 영화적 해석입니다. 창조와 족보를 과학적 도표나 확정된 고고학 복원으로 제시하지 않으며, 꿈과 시적 축복은 실제 현장과 구분합니다.',search:'창조, 무지개, 아브라함, 요셉…',plan:'genesis-image-plan.json',
 chapterNames:['태초의 빛과 심히 좋은 창조','안식과 에덴, 사람과 동반자','흔들린 신뢰, 동산 밖의 삶','두 형제와 폭력, 다시 부르는 이름','이어지는 세대와 노아의 탄생','강포한 세상과 방주의 준비','방주에 들어간 생명, 덮이는 땅','물러가는 물과 감람 잎의 소망','생명의 언약과 무지개, 노아의 집','여러 족속의 이름과 땅','바벨의 대와 흩어짐, 데라의 집','떠나라, 복이 되라는 부르심','다투지 않는 선택과 약속의 땅','롯의 구출과 멜기세덱의 축복','별처럼 많은 자손과 언약의 불','하갈의 광야, 고통을 들으시는 분','아브라함과 사라, 언약의 이름','마므레의 환대와 소돔을 위한 간구','소돔에서의 탈출과 남겨진 상처','아비멜렉의 꿈과 사라의 회복','이삭의 웃음, 하갈과 이스마엘의 샘','모리아의 두 사람, 준비하신 수양','사라의 죽음과 막벨라의 땅','리브가의 선택, 이삭의 사랑과 위로','아브라함의 마지막과 두 아들의 길','이삭의 우물, 다툼에서 넓은 자리로','속임으로 받은 복과 에서의 눈물','홀로 가는 야곱, 벧엘의 꿈','하란의 우물과 사랑, 레아의 아들들','경쟁하는 집과 요셉의 탄생','고향으로 떠나는 집과 돌무더기의 언약','얍복의 밤, 이스라엘이라는 이름','달려와 안은 형, 함께 흘린 눈물','디나의 상처와 복수의 상처','벧엘의 약속과 라헬의 마지막','에서와 에돔, 세일의 족속들','요셉의 꿈과 빈 구덩이, 아버지의 애곡','유다와 다말, 드러난 책임','요셉의 거절과 감옥에서의 돌봄','두 관원의 꿈과 잊힌 사람','바로의 꿈, 곡식을 쌓고 창고를 열다','양식을 구한 형들, 알아본 요셉','베냐민을 맡기다, 요셉의 눈물과 식탁','은잔의 시험, 대신 남겠다는 유다','나는 요셉이라, 화해와 살아 있다는 소식','함께 애굽으로, 고센의 부자 상봉','나그네가 왕을 축복하다, 기근의 대가','엇갈린 두 팔, 손자들에게 남긴 복','열두 아들의 미래와 야곱의 마지막','장례와 용서, 다음 여정의 소망'],
 arcs:[{chapters:'1–3장',title:'심히 좋은 창조, 깨어진 신뢰',copy:'빛과 생명, 안식과 동반자. 선한 동산에서 숨게 된 사람들과 떠나는 길.',chapter:1},{chapters:'4–11장',title:'퍼지는 상처, 보존되는 생명',copy:'형제의 폭력과 이어지는 세대, 홍수와 무지개, 여러 민족과 바벨의 흩어짐.',chapter:4,imageChapter:9},{chapters:'12–23장',title:'떠남과 기다림, 언약의 길',copy:'복이 되라는 부르심, 별처럼 많은 자손, 광야의 하갈과 늙은 사라의 웃음.',chapter:12,imageChapter:15},{chapters:'24–36장',title:'사랑과 갈등, 돌아오는 가족',copy:'리브가의 선택과 이삭의 우물, 야곱의 꿈과 노동, 얍복의 밤과 형제의 눈물.',chapter:24,imageChapter:33},{chapters:'37–50장',title:'꿈과 고난, 생명을 살리는 화해',copy:'팔려간 요셉과 맡겨진 나라, 되돌아온 형들, 책임지는 유다와 다시 만나는 아버지.',chapter:37,imageChapter:45}]},
 revelation:{name:'요한계시록',english:'THE REVELATION OF JOHN',storyTitle:'환난 가운데 신실하게, 새 창조를 바라보며',storyCopy:'일곱 교회에 보내는 말씀에서 어린양의 승리와 만물을 새롭게 하는 소망까지.',context:'요한계시록은 환난 가운데 있는 교회에 보내는 편지이자 예언이며, 상징으로 가득한 환상입니다. 보좌와 어린양, 심판과 경배, 짐승과 바벨론, 새 하늘과 새 땅을 통해 신실함과 소망을 전합니다. 그림은 각 맥락의 의미를 돕는 시각적 해석입니다. 상징의 모든 세부를 확정하거나 특정 현대 사건 및 종말의 시간표로 설명하지 않습니다.',search:'어린양, 촛대, 바벨론, 생명수…',plan:'revelation-image-plan.json',
 chapterNames:['계시와 증인, 일곱 촛대 사이의 주','처음 사랑과 고난 속의 충성','깨어 있음, 열린 문과 회개','열린 하늘과 보좌의 경배','봉인된 책과 죽임 당한 어린양','여섯 인, 고난과 심판의 물음','인침과 모든 민족의 큰 무리','고요와 기도, 네 나팔','무저갱과 파괴, 돌이키지 않는 마음','작은 책과 다시 예언할 사명','두 증인과 일곱째 나팔','여자와 용, 보호와 신실한 증언','두 짐승, 강요된 경배와 인내','어린양의 무리와 복음, 추수','유리 바다의 노래와 일곱 대접','일곱 대접과 심판의 완성','바벨론의 화려함과 짐승의 끝','무너진 성, 떠나는 백성과 애통','찬송과 혼인 잔치, 의로운 승리','결박과 회복, 마지막 심판','새 하늘과 새 땅, 열린 성','생명수와 생명나무, 오라 하시는 초청'],
 arcs:[{chapters:'1–3장',title:'교회에 보내는 말씀',copy:'처음 사랑과 회개, 고난 속의 충성, 깨어 기다리는 삶.',chapter:1},{chapters:'4–7장',title:'보좌와 어린양',copy:'경배와 봉인된 책, 고난의 물음과 모든 민족을 품는 구원의 소망.',chapter:4,imageChapter:5},{chapters:'8–16장',title:'심판과 증언, 신실함의 길',copy:'나팔과 대접의 환상 사이에서 들려오는 기도와 증언, 미혹을 견디는 인내.',chapter:8,imageChapter:12},{chapters:'17–20장',title:'바벨론의 끝과 어린양의 승리',copy:'자기를 높이는 권세의 무너짐, 증인들의 회복과 의로운 심판.',chapter:17,imageChapter:19},{chapters:'21–22장',title:'만물을 새롭게 하는 소망',copy:'눈물이 그치고 문이 열리며, 생명수와 생명나무가 만국을 살립니다.',chapter:21,imageChapter:22}]},
 romans:{name:'로마서',english:'THE LETTER TO THE ROMANS',storyTitle:'은혜로 시작해 사랑으로 살아가는 길',storyCopy:'모두에게 필요한 복음, 믿음으로 얻는 의, 성령 안의 생명과 함께 살아가는 사랑.',context:'로마서는 바울이 로마의 성도들에게 보낸 편지입니다. 모든 사람의 죄와 하나님의 의, 믿음으로 받는 은혜, 그리스도와의 연합, 이스라엘과 여러 민족을 향한 긍휼, 서로 받아들이는 공동체의 삶을 논증합니다. 그림은 논증을 이해하는 시각적 비유이며 편지 전체를 사건의 연속으로 바꾸지 않습니다.',search:'은혜, 믿음, 성령, 감람나무…',plan:'romans-image-plan.json',
 chapterNames:['복음의 능력과 사람의 어두움','차별 없는 판단과 마음의 진실','모두의 죄, 값없이 주시는 의','아브라함과 믿음의 약속','화평과 소망, 아담과 그리스도','죄에 대하여 죽고 새 생명으로','율법과 죄, 내 안의 갈등','성령 안의 생명과 끊을 수 없는 사랑','이스라엘과 약속, 하나님의 긍휼','가까이 있는 말씀, 듣고 믿는 복음','버리지 않으심과 한 감람나무','새로운 마음과 행동하는 사랑','질서와 사랑, 깨어 있는 삶','다름을 받아들이는 믿음과 화평','서로 짊어짐과 복음의 여정','동역자들의 이름과 온 민족의 복음'],
 arcs:[{chapters:'1–4장',title:'믿음으로 받는 하나님의 의',copy:'모두가 죄 아래 있지만, 의롭다 하심은 행위의 품삯이 아닌 은혜의 선물입니다.',chapter:1,imageChapter:3},{chapters:'5–8장',title:'새 생명과 끊을 수 없는 사랑',copy:'화평과 소망, 그리스도와의 연합, 성령 안의 자녀 됨과 사랑의 확신.',chapter:5,imageChapter:8},{chapters:'9–11장',title:'이스라엘과 여러 민족을 향한 긍휼',copy:'약속은 실패하지 않았습니다. 한 뿌리에 기대어 교만을 버리고 긍휼을 바라봅니다.',chapter:9,imageChapter:11},{chapters:'12–16장',title:'은혜를 살아내는 공동체',copy:'마음을 새롭게 하고 사랑을 실천하며, 다른 사람을 받아들이고 함께 복음을 섬깁니다.',chapter:12,imageChapter:14}]},
 john:{name:'요한복음',english:'THE GOSPEL OF JOHN',storyTitle:'생명을 향한 한 권의 여정',storyCopy:'말씀과 빛으로 시작해, 믿고 생명을 얻는 이야기로 이어집니다.',context:'요한복음은 예수님이 누구신지, 그분을 믿는 것이 어떤 생명으로 이어지는지를 만남과 표적, 말씀과 십자가, 부활을 통해 증언합니다.',search:'우물, 사랑, 생명…',plan:'image-plan.json'},
 acts:{name:'사도행전',english:'THE ACTS OF THE APOSTLES',storyTitle:'예루살렘에서 땅 끝까지',storyCopy:'성령으로 시작된 증언이 경계를 넘어, 로마의 열린 집까지 이어집니다.',context:'사도행전은 누가복음에 이어, 부활하신 예수님의 증인들이 성령의 인도하심을 따라 예루살렘과 유대, 사마리아를 넘어 여러 민족에게 복음을 전하는 여정을 보여 줍니다.',search:'성령, 루디아, 바울, 로마…',plan:'acts-image-plan.json',
 chapterNames:['승천과 증인의 부르심','오순절과 함께 나누는 교회','미문에서 일어난 사람','담대한 증언과 한마음의 기도','사람보다 하나님께 순종','일곱 섬김의 사람과 스데반','스데반의 증언과 마지막 기도','사마리아와 광야 길의 만남','사울의 회심과 다비다의 회복','고넬료의 집, 이방인에게 열린 문','안디옥의 그리스도인들','옥문을 여신 하나님','안디옥에서 시작한 첫 여정','루스드라의 표적과 환난','예루살렘의 의논과 은혜','루디아, 감옥의 찬송과 간수','베뢰아의 말씀, 아덴의 질문','고린도와 브리스길라·아굴라','에베소에서 일어난 변화와 소동','밀레도의 눈물과 맡겨진 양 떼','예루살렘으로 돌아온 바울','계단 위의 증언과 로마 시민권','로마를 향한 약속과 밤의 호송','벨릭스 앞의 부활의 소망','가이사에게 호소한 바울','아그립바 앞의 증언','풍랑 속에서도 잃지 않은 소망','멜리데와 로마, 금하지 못한 말씀'],
 arcs:[{chapters:'1–7장',title:'예루살렘의 증인들',copy:'성령의 약속과 오순절, 나누는 공동체와 박해 속의 증언.',chapter:1,imageChapter:2},{chapters:'8–12장',title:'경계를 넘어선 복음',copy:'사마리아, 에디오피아 관원, 사울과 고넬료, 안디옥의 공동체.',chapter:8},{chapters:'13–20장',title:'여러 민족을 향한 여정',copy:'바울과 동역자들의 항해, 도시마다 열린 만남과 말씀.',chapter:13,imageChapter:16},{chapters:'21–28장',title:'결박 너머로 열린 길',copy:'예루살렘과 가이사랴의 재판, 풍랑과 멜리데, 로마의 열린 집.',chapter:21,imageChapter:27}]}
};
Object.assign(books,pentateuchBooks,historicalBooks,psalmsBooks,proverbsBooks,epistleBooks);
async function loadBook(id,nextLanguage=language,startAtBeginning=false){
 if(!books[id])id='john';
 const version=++loadVersion;
 $('book').disabled=true;$('language').disabled=true;$('open-language').disabled=true;remember();cancelAnimationFrame(scrollFrame);
 try{
 const response=await fetchContent(`data/${id}.json`);if(!response.ok)throw Error(text(language).loadFailed);let next=await response.json();
 if(nextLanguage!=='ko'||catalog.ko?.licensedBooks?.includes(id)){
  const translated=await fetchContent(`data/translations/${nextLanguage}/${id}.json`);
  if(!translated.ok)throw Error(messages[nextLanguage].unavailable);
  next=applyTranslation(next,await translated.json(),nextLanguage);
 }
 next.language=nextLanguage;
 if(version!==loadVersion)return;
 data=next;bookId=id;language=nextLanguage;localizeHeader();current=0;document.body.dataset.book=id;document.body.dataset.letter=epistleBooks[id]?'true':'false';const config=books[id];
 $('book').value=id;document.title=`${t().appTitle} · ${data.book}`;
 $('reading-book-label').textContent=config.english;$('reading-book-title').textContent=data.book;
 $('gallery-chapter').replaceChildren(new Option(ui().all,'0'));
 for(let c=1;c<=data.chapters;c++)$('gallery-chapter').append(new Option(ui().chapter(c),String(c)));
 $('gallery-description').textContent=`${data.chapters}장, ${data.verseCount.toLocaleString()}절을 ${data.sceneCount}개의 맥락으로 따라 읽습니다.`;
 $('gallery-title').textContent=`장면으로 보는 ${data.book}`;
 $('story-title').textContent=config.storyTitle;$('story-copy').textContent=config.storyCopy;$('book-context').textContent=config.context;
 $('chapter-map-title').textContent=`${data.chapters}장의 흐름`;
 $('search').value='';$('search').placeholder=config.search;
 $('prompt-source').href=isNative?`${SITE_ORIGIN}/${config.plan}`:config.plan;$('prompt-source').textContent=t().imagePrompts(data.sceneCount);
 $('source-notes').textContent=id==='proverbs'?'잠언의 지혜와 가르침을 문맥에 따라 시각화했습니다. 본문은 개역한글 원본을 보존합니다.':id==='psalms'?`시편의 다섯 권 흐름과 각 시의 기도·비유를 따라 구성했습니다. 역사 회상은 장면 설명에서 구분하고, 어둠 속에서 끝나는 탄식에 임의의 밝은 결말을 덧붙이지 않습니다. 본문은 개역한글 원본 그대로 보존했습니다.${data.partialRelease&&data.partialRelease.availableImages<data.sceneCount?` 그림 ${data.partialRelease.availableImages}장이 준비되었고, 나머지 그림은 제작 중입니다.`:''}`:historicalBooks[id]?`${data.book}의 인물과 장소, 선택과 결과를 본문의 흐름에 따라 시각화했습니다. 회상과 비유는 현재 사건과 구분하며, 본문은 개역한글 원본을 보존합니다.${id==='joshua'?' 여호수아 2:12–13은 원본의 합절 표기를 따라 함께 표시합니다.':id==='1samuel'?' 사무엘상 30:30–31은 원본의 합절을 보존합니다.':''}`:pentateuchBooks[id]?`${data.book}의 서사와 규례를 본문에 따라 구분하여 시각화했습니다. 율법·제의·시적 약속을 설명하는 그림은 실제 사건으로 단정하지 않습니다. 본문은 개역한글 원본을 보존합니다.${id==='deuteronomy'?' 신명기 30:9–10은 개역한글의 합절 표기를 따라 함께 표시합니다.':''}${data.partialRelease&&data.partialRelease.availableImages<data.sceneCount?` 그림 ${data.partialRelease.availableImages}장이 준비되었고, 나머지 그림은 제작 중입니다.`:''}`:epistleBooks[id]?`${data.book}의 가르침과 관계를 시각적 비유와 편집 장면으로 표현했습니다. 과거 회상은 설명에서 구분하며, 본문은 개역한글 원본 그대로 보존했습니다.${id==='hebrews'?' 히브리서의 저자는 본문에서 이름을 밝히지 않습니다.':''}${data.partialRelease&&data.partialRelease.availableImages<data.sceneCount?` 그림 ${data.partialRelease.availableImages}장이 준비되었고, 나머지 그림은 제작 중입니다.`:''}`:['matthew','mark','luke'].includes(id)?'각 복음서의 서술 순서와 인물 수, 만남의 장소를 따라 구성했습니다. 비유와 꿈, 족보를 그린 장면은 설명에서 구분합니다. 본문의 괄호와 (없음) 표기도 원본대로 보존했습니다.':id==='genesis'?'창조의 장면은 본문의 의미를 돕는 시각화이며 과학적 시간표나 확정된 지리 복원이 아닙니다. 족보는 세대의 이어짐을 구성한 편집 장면으로, 꿈과 시적 축복은 실제 현장과 구분합니다. 의복·건물·인물의 모습도 시각적 해석입니다.':id==='revelation'?'요한계시록의 환상과 상징은 맥락을 이해하도록 시각화했습니다. 특정 현대 인물·국가·기술이나 종말의 시간표로 단정하지 않으며, 핵심 이미지를 선택한 편집 해석입니다.':id==='romans'?'로마서는 편지의 논증을 시각적 비유와 편집 장면으로 표현합니다. 아브라함 등의 과거 회상은 구분하며, 16:24의 (없음) 표기를 원본대로 보존했습니다.':id==='john'?'비유와 가르침을 그린 장면은 설명에서 구분합니다. 요한복음 5:3–4와 7:53–8:11의 본문 괄호도 원본대로 유지했습니다.':'환상과 설교 속 과거 이야기는 장면 설명에서 구분합니다. 사도행전의 (없음) 및 [25절과 같음] 표기도 전자 본문 원본대로 유지했습니다.';
 $('explanation').hidden=true;$('explain').setAttribute('aria-expanded','false');$('error').hidden=true;
 renderBook();notes.refresh();renderStory();renderGallery();
 $('translation-attribution').textContent=data.attribution||'성경전서 개역한글판 © 대한성서공회 1961.';
 $('translation-edition').textContent=data.translation;
 $('text-data').href=data.textData||'https://github.com/yuhwan/Bible-krv';$('translation-license').href=data.copyrightSource||'https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5';
 if(language!=='ko'){
  $('gallery-title').textContent=`${data.book} · ${ui().gallery}`;$('gallery-description').textContent=ui().scenes(data.sceneCount);
  $('story-title').textContent=`${data.book} · ${ui().story}`;$('story-copy').textContent='';$('book-context').textContent='';$('chapter-map-title').textContent=ui().story;
  $('search').placeholder=data.book;$('source-notes').textContent='';$('explanation').textContent='';
 }
 let saved=0;try{if(!preview){saved=Number(localStorage.getItem(`visual-bible-${id}`))-1;const position=JSON.parse(localStorage.getItem(`vible-position-${id}`)||'null');if(position)saved=data.scenes.findIndex(s=>s.chapter===position.chapter&&s.first<=position.verse&&s.last>=position.verse);localStorage.setItem('visual-bible-book',id);}}catch{}
 const params=new URLSearchParams(location.search);const linked=params.get('book')===id?data.scenes.findIndex(s=>s.chapter===Number(params.get('chapter'))&&s.first<=Number(params.get('verse'))&&s.last>=Number(params.get('verse'))):-1;goTo(startAtBeginning?0:linked>=0?linked:Number.isInteger(saved)&&saved>=0&&saved<data.scenes.length?saved:0);
 }finally{if(version===loadVersion){$('book').disabled=false;$('language').disabled=false;$('open-language').disabled=false;}}
}
function popoverOpen(element){return typeof element.showPopover==='function'&&!element.dataset.fallback?element.matches(':popover-open'):element.dataset.fallbackOpen==='true';}
function supportPopovers(){
 if(typeof HTMLElement.prototype.showPopover==='function')return;
 const panels=[...document.querySelectorAll('[popover]')];
 for(const panel of panels){
  panel.hidden=true;panel.dataset.fallback='true';
  const toggle=open=>{const state=open?'open':'closed';for(const type of ['beforetoggle','toggle']){const event=new Event(type);event.newState=state;if(type==='toggle'){panel.hidden=!open;if(open)panel.dataset.fallbackOpen='true';else delete panel.dataset.fallbackOpen;}panel.dispatchEvent(event);}};
  panel.hidePopover=()=>toggle(false);
  const button=document.querySelector(`[popovertarget="${panel.id}"]`);
  button.onclick=()=>{const open=!popoverOpen(panel);for(const other of panels)if(other!==panel)other.hidePopover();toggle(open);};
 }
 document.addEventListener('pointerdown',e=>{for(const panel of panels)if(popoverOpen(panel)&&!panel.contains(e.target)&&!e.target.closest(`[popovertarget="${panel.id}"]`))panel.hidePopover();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')for(const panel of panels)panel.hidePopover();});
}
async function init(){
 supportPopovers();
 $('book').addEventListener('change',()=>loadBook($('book').value,catalog[preferredLanguage]?.books.includes($('book').value)?preferredLanguage:catalog[language]?.books.includes($('book').value)?language:'ko').catch(showError));
 for(const button of document.querySelectorAll('[data-language]'))button.onclick=()=>{$('language-menu').hidePopover();$('language').value=button.dataset.language;$('language').dispatchEvent(new Event('change'));};
 $('language-menu').addEventListener('beforetoggle',e=>{if(e.newState==='open'){const rect=$('open-language').getBoundingClientRect();$('language-menu').style.top=`${rect.bottom+8}px`;$('language-menu').style.left=`${Math.max(8,Math.min(rect.right-220,innerWidth-228))}px`;}});
 $('language').onchange=async()=>{
  const requested=$('language').value;
  if(!catalog[requested]?.books.includes(bookId)){$('language-status').textContent=messages[requested].unavailable;$('language').value=language;return;}
  try{await loadBook(bookId,requested);preferredLanguage=requested;try{localStorage.setItem('vible-language',requested);}catch{}const url=new URL(location.href);url.searchParams.set('lang',requested);history.replaceState(null,'',url);$('language-status').textContent='';}catch(e){showError(e);$('language').value=language;}
 };
 for(const key of ['read','story','gallery'])$(`${key}-tab`).addEventListener('click',()=>{$('navigation-dialog').hidePopover();showView(key);if(key==='gallery')renderGallery();});
 const menu=$('navigation-dialog'),menuButton=$('open-menu');
 function positionMenu(){
  const rect=menuButton.getBoundingClientRect(),width=Math.min(320,innerWidth-24);
  const left=Math.max(12,Math.min(rect.right-width,innerWidth-width-12));
  menu.style.width=`${width}px`;menu.style.left=`${left}px`;menu.style.top=`${rect.bottom+10}px`;
  menu.style.maxHeight=`${Math.max(0,innerHeight-rect.bottom-22)}px`;
  menu.style.overflowY=innerHeight-rect.bottom-22<400?'auto':'visible';
  menu.style.setProperty('--menu-pointer',`${Math.max(18,Math.min(rect.left+rect.width/2-left,width-18))}px`);
 }
 menu.addEventListener('beforetoggle',e=>{if(e.newState==='open')positionMenu();});
 menu.addEventListener('toggle',e=>{const open=e.newState==='open';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?interfaceCopy[language].closeMenu:interfaceCopy[language].menu);});
 window.addEventListener('resize',()=>{if(popoverOpen(menu))positionMenu();});
 window.addEventListener('scroll',()=>{if(popoverOpen(menu))positionMenu();},{passive:true});
 $('close-menu').onclick=()=>{menu.hidePopover();menuButton.focus();};
 $('notes-tab').onclick=()=>{
 $('saved-notes-title').textContent=interfaceCopy[language].notes;
  $('navigation-dialog').hidePopover();$('saved-notes-book').textContent=data.book;
  let saved={};try{saved=JSON.parse(localStorage.getItem(`vible-notes-${bookId}`)||'{}')||{};}catch{}
  const entries=data.scenes.flatMap(s=>s.verses.map(v=>({scene:s,verse:v,record:saved[`${s.chapter}:${v.verse}`]}))).filter(e=>e.record?.highlight||e.record?.note);
  const cards=entries.map(({scene,verse,record})=>{const b=document.createElement('button');b.className='saved-note';const ref=document.createElement('strong');ref.textContent=`${data.book} ${scene.chapter}:${verse.verse}${record.highlight?` · ${t().highlight}`:''}`;const text=document.createElement('span');text.textContent=verse.text;b.append(ref,text);if(record.note){const note=document.createElement('p');note.textContent=record.note;b.append(note);}b.onclick=()=>{$('saved-notes-dialog').close();goTo(scene.id-1);notes.editVerse(scene.chapter,verse.verse);};return b;});
  if(!cards.length){const empty=document.createElement('p');empty.textContent=t().noNotes;cards.push(empty);}
  $('saved-notes-list').replaceChildren(...cards);$('saved-notes-dialog').showModal();
 };
 $('close-saved-notes').onclick=()=>$('saved-notes-dialog').close();
 $('gallery-chapter').addEventListener('change',renderGallery);$('search').addEventListener('input',renderGallery);
 setupSceneProgress($('progress'),goTo,()=>current);
 setupBookContinuation($('reader'),()=>!!data&&view==='read'&&!manual&&!$('book').disabled&&!!nextBookId()&&!document.body.classList.contains('image-only')&&!document.querySelector('dialog[open]')&&getSelection()?.isCollapsed!==false,()=>continueToNextBook().catch(showError));
 $('reader').addEventListener('scroll',scrollScene,{passive:true});$('previous').addEventListener('click',()=>goTo(current-1));$('next').addEventListener('click',()=>goTo(current+1));
 $('reader-previous-chapter').onclick=()=>goTo(data.scenes.findIndex(s=>s.chapter===data.scenes[current].chapter-1));
 $('reader-next-chapter').onclick=()=>goTo(data.scenes.findIndex(s=>s.chapter===data.scenes[current].chapter+1));
 $('explain').addEventListener('click',()=>{$('explanation').hidden=!$('explanation').hidden;$('explain').setAttribute('aria-expanded',String(!$('explanation').hidden));});
 $('source-button').addEventListener('click',()=>$('source-dialog').showModal());$('close-source').addEventListener('click',()=>$('source-dialog').close());
 function setFont(size){
  fontSize=Math.max(16,Math.min(31,Number(size)||19));
  const reader=$('reader'),top=reader.getBoundingClientRect().top;
  const anchor=[...reader.querySelectorAll('[data-verse]')].find(p=>p.getBoundingClientRect().bottom>top);
  const offset=anchor?anchor.getBoundingClientRect().top-top:0;
  document.documentElement.style.setProperty('--body-size',`${fontSize}px`);
  if(anchor)reader.scrollTop+=anchor.getBoundingClientRect().top-top-offset;
  $('font-size').textContent=t().textSize(fontSize);
  $('font-smaller').disabled=fontSize===16;$('font-larger').disabled=fontSize===31;
  try{localStorage.setItem('vible-font-size',String(fontSize));}catch{}
 }
 let storedFont;try{storedFont=Number(localStorage.getItem('vible-font-size'));}catch{}
 setFont(storedFont>=16&&storedFont<=31?storedFont:19);
 $('font-smaller').onclick=()=>setFont(fontSize-1);$('font-larger').onclick=()=>setFont(fontSize+1);
 function setImageOnly(active){
  document.body.classList.toggle('image-only',active);
  $('focus').setAttribute('aria-pressed',String(active));
  const label=active?interfaceCopy[language].showText:interfaceCopy[language].hideText;
  $('focus').setAttribute('aria-label',label);$('focus').title=label;
  if(active){window.getSelection()?.removeAllRanges();$('selection-tools').hidden=true;}
 }
 $('focus').onclick=()=>setImageOnly(!document.body.classList.contains('image-only'));
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||(document.querySelector('dialog[open]')||[...document.querySelectorAll('[popover]')].some(popoverOpen)))return;if(e.key==='Escape')setImageOnly(false);if(view==='read'&&e.key==='ArrowRight'){e.preventDefault();goTo(current+1);}if(view==='read'&&e.key==='ArrowLeft'){e.preventDefault();goTo(current-1);}});
 const params=new URLSearchParams(location.search);let storedLanguage;try{storedLanguage=localStorage.getItem('vible-language');}catch{}
 preferredLanguage=initialLanguage({url:params.get('lang'),saved:storedLanguage,locales:navigator.languages||[navigator.language]});
 const catalogResponse=await fetchContent('data/translations/catalog.json');if(!catalogResponse.ok)throw Error('Language catalog unavailable');catalog=await catalogResponse.json();
 let initial=params.get('book');try{if(!initial&&!preview)initial=localStorage.getItem('visual-bible-book');}catch{}const firstBook=books[initial]?initial:'john';const ready=catalog[preferredLanguage]?.books.includes(firstBook);
 if(!ready)$('language-status').textContent=messages[preferredLanguage].unavailable;
 await loadBook(firstBook,ready?preferredLanguage:'ko');
}
function localizeHeader(){
 search.localize();
 document.documentElement.lang=language;localizeDocument(language);localizeInstall();$('font-size').textContent=t().textSize(fontSize);
 const copy=interfaceCopy[language];
 for(const [id,key] of [['notes-tab','notes'],['save-note','saveNote'],['share-card','imageShare'],['share-link','linkShare'],['download-card','saveImage'],['copy-link','copyLink']])$(id).textContent=copy[key];
 document.querySelector('#navigation-dialog .menu-help').textContent=copy.help;
 document.querySelector('label[for=personal-note]').textContent=copy.reflection;$('personal-note').placeholder=copy.placeholder;
 $('install-label').textContent=copy.install;$('focus').setAttribute('aria-label',copy.hideText);$('focus').title=copy.hideText;$('open-menu').setAttribute('aria-label',copy.menu);
 document.querySelector('.bible-context').hidden=language!=='ko';
 $('language-flag').textContent={ko:'🇰🇷',en:'🇺🇸',ja:'🇯🇵',zh:'🇨🇳'}[language];$('open-language').setAttribute('aria-label',`${ui().language}: ${languageNames[language]}`);$('open-language').title=ui().language;
 for(const button of document.querySelectorAll('[data-language]')){button.setAttribute('aria-checked',String(button.dataset.language===language));button.querySelector('small').textContent=catalog[button.dataset.language]?.books.includes(bookId)?'':{ko:'준비 중',en:'Coming soon',ja:'準備中',zh:'准备中'}[button.dataset.language];}$('language').value=language;$('language').setAttribute('aria-label',ui().language);
 for(const option of $('book').options)option.textContent=bookNames[language][option.value];picker.localize();
 for(const [id,key] of [['read-tab','read'],['story-tab','story'],['gallery-tab','gallery'],['source-button','source']])$(id).textContent=ui()[key];
 $('previous').querySelector('.step-label').textContent=ui().previous;$('next').querySelector('.step-label').textContent=ui().next;
 $('font-smaller').textContent=language==='ko'?'가−':language==='en'?'A−':'字−';$('font-larger').textContent=language==='ko'?'가+':language==='en'?'A+':'字+';
}
function showError(e){$('error').hidden=false;$('error').textContent=e.message;if(data)$('book').value=bookId;}
init().catch(showError);
