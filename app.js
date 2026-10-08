const $=id=>document.getElementById(id);
const pad=n=>String(n).padStart(2,'0');
const preview=new URLSearchParams(location.search).has('preview');
let data,current=0,view='read',scrollFrame=0,fontStep=0,manual=false;
const chapterNames=['말씀과 첫 만남','가나의 표적과 성전','거듭남과 하나님의 사랑','사마리아의 우물, 생수','베데스다와 생명의 권세','오병이어와 생명의 떡','초막절과 생수의 약속','빛과 자유, 예수님의 증언','보게 된 사람의 증언','선한 목자와 양의 음성','나사로, 부활과 생명','예루살렘에 오시는 왕','끝까지 사랑하신 마지막 식탁','길과 진리, 보혜사와 평안','포도나무와 가지, 사랑','근심에서 기쁨으로','하나 됨을 위한 기도','동산의 체포와 관정의 질문','십자가와 새 무덤','부활의 아침과 믿음','바닷가의 식탁, 다시 따르라'];
const reference=s=>`요한복음 ${s.chapter}:${s.first}${s.last===s.first?'':`–${s.last}`}`;
const image=s=>`assets/${s.image}`;
function showView(next){view=next;window.scrollTo({top:0,behavior:'instant'});for(const key of ['read','story','gallery']){$(`${key==='read'?'reading':key}-view`).hidden=key!==next;const b=$(`${key}-tab`);if(key===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}document.body.classList.remove('immersive');$('focus').hidden=next!=='read';}
function remember(){if(preview)return;try{localStorage.setItem('visual-bible-john',String(data.scenes[current].id));}catch{}}
function updateScene(index){
 if(index<0||index>=data.scenes.length)return;
 current=index;const s=data.scenes[index];
 $('current-reference').textContent=reference(s);$('current-title').textContent=s.title;
 $('scene-position').textContent=`${pad(index+1)} / ${data.sceneCount}`;
 $('progress').style.width=`${(index+1)/data.sceneCount*100}%`;
 $('previous').disabled=index===0;$('next').disabled=index===data.scenes.length-1;
 $('visual').alt=`${reference(s)} · ${s.title}`;
 $('visual').src=image(s);$('visual').style.animation='none';void $('visual').offsetWidth;$('visual').style.animation='';
 $('visual').onerror=()=>{$('image-loading').hidden=false;};$('visual').onload=()=>{$('image-loading').hidden=true;};
 $('explanation').textContent=s.kind==='metaphor'?'이 장면은 본문의 비유·가르침을 시각적으로 표현했습니다. 실제 사건의 모습과 구분해 읽어 주세요.':'본문의 인물·장소·행동을 바탕으로 그린 장면입니다. 의복과 건물, 인물의 모습은 이해를 위한 시각적 해석입니다.';
 $('bible-source').href=s.source;
 document.querySelectorAll('.passage').forEach(p=>p.classList.toggle('active',Number(p.dataset.id)===s.id));
 remember();
 // Warm only neighboring assets, rather than downloading the whole book.
 for(const neighbor of [index-1,index+1])if(data.scenes[neighbor]){const pre=new Image();pre.src=image(data.scenes[neighbor]);}
}
function renderChapter(chapter){
 $('chapter').value=String(chapter);$('chapter-title').textContent=`요한복음 ${chapter}장`;
 const scenes=data.scenes.filter(s=>s.chapter===chapter);
 const fragment=document.createDocumentFragment();
 for(const s of scenes){const section=document.createElement('section');section.className='passage';section.dataset.id=s.id;const heading=document.createElement('h3');heading.textContent=`${s.first}–${s.last}절 · ${s.title}`;section.append(heading);for(const v of s.verses){const p=document.createElement('p');const num=document.createElement('span');num.className='verse-number';num.textContent=v.verse;p.append(num,document.createTextNode(v.text));section.append(p);}fragment.append(section);}
 const button=document.createElement('button');button.className='next-chapter';button.textContent=chapter<21?`${chapter+1}장으로 이어 읽기 →`:'요한복음의 전체 흐름 보기 →';button.addEventListener('click',()=>chapter<21?goTo(data.scenes.findIndex(s=>s.chapter===chapter+1)):showView('story'));fragment.append(button);
 $('reader').replaceChildren(fragment);$('reader').dataset.chapter=String(chapter);$('reader').scrollTop=0;
}
function goTo(index){
 if(index<0||index>=data.scenes.length)return;
 showView('read');manual=true;
 const chapter=data.scenes[index].chapter;
 if(Number($('reader').dataset.chapter)!==chapter)renderChapter(chapter);
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
 const arcs=[{chapters:'1장',title:'말씀과 빛',copy:'우리 가운데 오신 말씀. 첫 증인들과 첫 제자들의 만남.',chapter:1},{chapters:'2–12장',title:'만남과 표적',copy:'일상의 갈증과 질문 속에서 드러나는 예수님의 정체와 생명.',chapter:4},{chapters:'13–17장',title:'끝까지 사랑',copy:'마지막 식탁, 섬김과 사랑, 떠나심의 약속과 하나 됨의 기도.',chapter:13},{chapters:'18–21장',title:'십자가와 부활',copy:'자신을 내어주신 분, 다시 찾아오신 분, 다시 따르는 사람들.',chapter:20}];
 $('story-arcs').replaceChildren(...arcs.map(a=>{const s=data.scenes.find(s=>s.chapter===a.chapter);const b=document.createElement('button');b.className='arc-card';const img=document.createElement('img');img.src=image(s);img.alt=s.title;img.loading='lazy';const copy=document.createElement('div');copy.className='arc-copy';const small=document.createElement('small');small.textContent=a.chapters;const h=document.createElement('h2');h.textContent=a.title;const p=document.createElement('p');p.textContent=a.copy;copy.append(small,h,p);b.append(img,copy);b.addEventListener('click',()=>goTo(s.id-1));return b;}));
 $('chapter-map').replaceChildren(...chapterNames.map((name,i)=>{const scenes=data.scenes.filter(s=>s.chapter===i+1);const b=document.createElement('button');b.className='chapter-card';const n=document.createElement('span');n.className='chapter-number';n.textContent=pad(i+1);const d=document.createElement('div');const h=document.createElement('h3');h.textContent=name;const p=document.createElement('p');p.textContent=`${scenes.length}개 맥락 · ${scenes.reduce((n,s)=>n+s.verses.length,0)}절`;d.append(h,p);b.append(n,d);b.addEventListener('click',()=>goTo(scenes[0].id-1));return b;}));
}
async function init(){
 const response=await fetch('data/john.json');if(!response.ok)throw Error('성경 본문을 불러오지 못했습니다.');data=await response.json();
 for(let c=1;c<=21;c++){for(const id of ['chapter','gallery-chapter']){const o=document.createElement('option');o.value=c;o.textContent=`${c}장`;$ (id).append(o);}}
 $('gallery-description').textContent=`21장, ${data.verseCount}절을 ${data.sceneCount}개의 맥락으로 따라 읽습니다.`;
 for(const key of ['read','story','gallery'])$(`${key}-tab`).addEventListener('click',()=>{showView(key);if(key==='gallery')renderGallery();});
 $('chapter').addEventListener('change',()=>goTo(data.scenes.findIndex(s=>s.chapter===Number($('chapter').value))));
 $('gallery-chapter').addEventListener('change',renderGallery);$('search').addEventListener('input',renderGallery);
 $('reader').addEventListener('scroll',scrollScene,{passive:true});$('previous').addEventListener('click',()=>goTo(current-1));$('next').addEventListener('click',()=>goTo(current+1));
 $('explain').addEventListener('click',()=>{$('explanation').hidden=!$('explanation').hidden;});
 $('source-button').addEventListener('click',()=>$('source-dialog').showModal());$('close-source').addEventListener('click',()=>$('source-dialog').close());
 $('font').addEventListener('click',()=>{fontStep=(fontStep+1)%3;document.documentElement.style.setProperty('--body-size',`${[19,22,25][fontStep]}px`);goTo(current);});
 $('focus').addEventListener('click',()=>document.body.classList.toggle('immersive'));
 document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||$('source-dialog').open)return;if(e.key==='Escape')document.body.classList.remove('immersive');if(view==='read'&&e.key==='ArrowRight'){e.preventDefault();goTo(current+1);}if(view==='read'&&e.key==='ArrowLeft'){e.preventDefault();goTo(current-1);}});
 renderStory();let saved=0;try{if(!preview)saved=Number(localStorage.getItem('visual-bible-john'))-1;}catch{}goTo(Number.isInteger(saved)&&saved>=0&&saved<data.scenes.length?saved:0);
}
init().catch(e=>{$('error').hidden=false;$('error').textContent=e.message;});
