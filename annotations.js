import {assetURL} from './assets.js';
import {passageURL} from './languages.js';
import {shareLink,shareFile,saveFile,canShareLink} from './platform.js';
import {text} from './i18n.js';
const $=id=>document.getElementById(id);
export function annotations(context){
 const t=()=>text(context().language||'ko');
 let sceneSharing=false,selected=[],selectionText='',cardFile=null,cardURL='',revision=0,selectionTimer,noteTimer,selectedRange=null,positionFrame;
 let touch=typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches;
 $('reader').addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touch=true;document.body.classList.add('touch-selection');}});
 const storageKey=()=>`vible-notes-${context().bookId}`;
 const records=()=>{try{return JSON.parse(localStorage.getItem(storageKey())||'{}');}catch{return {};}};
 const key=p=>`${p.dataset.chapter}:${p.dataset.verse}`;
 const status=t=>$('note-status').textContent=t;
 function paint(){const notes=records();for(const p of $('reader').querySelectorAll('[data-verse]')){p.classList.toggle('highlighted',!!notes[key(p)]?.highlight);p.classList.toggle('has-note',!!notes[key(p)]?.note);}}
 function positionTools(){const tools=$('selection-tools');if(sceneSharing||!selected.length||$('note-dialog').open){tools.hidden=true;return;}const reader=$('reader').getBoundingClientRect(),top=Math.max(12,reader.top),bottom=Math.min(window.innerHeight-12,reader.bottom);const rects=selectedRange?[...selectedRange.getClientRects()]:selected.map(p=>p.querySelector('.verse-text').getBoundingClientRect());const visible=rects.filter(r=>r.width&&r.bottom>top&&r.top<bottom);if(!visible.length){tools.hidden=true;return;}tools.hidden=false;const first=visible[0],last=visible.at(-1),box=tools.getBoundingClientRect();let y=first.top-box.height-10;if(y<top)y=last.bottom+10;y=Math.max(top,Math.min(y,bottom-box.height));const x=Math.max(12,Math.min((first.left+first.right-box.width)/2,window.innerWidth-box.width-12));tools.style.left=`${x}px`;tools.style.top=`${y}px`;}
 function schedulePosition(){cancelAnimationFrame(positionFrame);positionFrame=requestAnimationFrame(positionTools);}
 $('reader').addEventListener('scroll',schedulePosition,{passive:true});window.addEventListener('resize',schedulePosition);window.addEventListener('scroll',schedulePosition,{passive:true});window.visualViewport?.addEventListener('resize',schedulePosition);window.visualViewport?.addEventListener('scroll',schedulePosition);
 $('selection-tools').addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')e.preventDefault();});
 function markSelection(){if(!touch)return;for(const p of $('reader').querySelectorAll('[data-verse]'))p.classList.toggle('is-selected',touch&&selected.includes(p));}
 function pick(nodes,text='',range=null){sceneSharing=false;selected=nodes;markSelection();selectedRange=range;selectionText=text||nodes.map(p=>p.querySelector('.verse-text').textContent).join('\n');$('highlight-selection').setAttribute('aria-pressed',String(nodes.length>0&&nodes.every(p=>records()[key(p)]?.highlight)));positionTools();}
 function capture(){if($('note-dialog').open)return;const sel=window.getSelection();if(!sel?.rangeCount||sel.isCollapsed)return;const range=sel.getRangeAt(0);if(!$('reader').contains(range.startContainer)||!$('reader').contains(range.endContainer))return;const nodes=[...$('reader').querySelectorAll('[data-verse]')].filter(p=>range.intersectsNode(p.querySelector('.verse-text')));if(nodes.length)pick(nodes,'',range.cloneRange());}
 document.addEventListener('selectionchange',()=>{if($('note-dialog').open)return;clearTimeout(selectionTimer);selectionTimer=setTimeout(capture,120);});
 $('reader').addEventListener('contextmenu',e=>{if(touch&&e.target.closest('.verse-text,.verse-number'))e.preventDefault();});
 $('reader').addEventListener('click',e=>{
  const target=e.target.closest(touch?'.verse-text,.verse-number':'.verse-number');if(!target)return;
  const verse=target.closest('[data-verse]');
  if(touch&&selected.length){
   const verses=[...$('reader').querySelectorAll('[data-verse]')],first=verses.indexOf(selected[0]),last=verses.indexOf(verse);
   if(first===last){selected=[];markSelection();$('selection-tools').hidden=true;return;}
   pick(verses.slice(Math.min(first,last),Math.max(first,last)+1));
  }else pick([verse]);
 });
 function save(change){const notes=records();for(const p of selected)notes[key(p)]={...notes[key(p)],...change};try{localStorage.setItem(storageKey(),JSON.stringify(notes));paint();return true;}catch{status(t().storageUnavailable);return false;}}
 $('highlight-selection').onclick=()=>{const notes=records();const highlighted=selected.every(p=>notes[key(p)]?.highlight);if(save({highlight:!highlighted}))$('highlight-selection').setAttribute('aria-pressed',String(!highlighted));};
 $('dismiss-selection').onclick=()=>{$('selection-tools').hidden=true;window.getSelection()?.removeAllRanges();selected=[];selectedRange=null;markSelection();};
 function ref(){const {data}=context();const first=selected[0],last=selected.at(-1);return `${data.book} ${key(first)}${first===last&&!first.dataset.endVerse?'':`–${first.dataset.chapter===last.dataset.chapter?(last.dataset.endVerse||last.dataset.verse):key(last)}`}`;}
 function link(){const first=selected[0],last=selected.at(-1),{bookId,language='ko'}=context();const path=passageURL(bookId,first.dataset.chapter,first.dataset.verse,last.dataset.chapter,last.dataset.endVerse||last.dataset.verse,language);return `https://vible.now${path}`;}
 function open(){if(!selected.length)return;$('selected-reference').textContent=ref();$('selected-scripture').textContent=selectionText;$('personal-note').value=records()[key(selected[0])]?.note||'';$('share-url').value=link();status(t().noteHint);$('selection-tools').hidden=true;$('note-dialog').showModal();renderCard();}
 $('note-selection').onclick=open;$('share-selection').onclick=open;$('note-dialog').addEventListener('close',()=>{if(sceneSharing){selected=[];selectedRange=null;sceneSharing=false;markSelection();}schedulePosition();});
 $('close-note').onclick=()=>$('note-dialog').close();$('save-note').onclick=()=>{if(save({note:$('personal-note').value,highlight:true}))status(t().noteSaved);};
 $('personal-note').oninput=()=>{cardFile=null;$('share-card').disabled=true;$('download-card').disabled=true;clearTimeout(noteTimer);noteTimer=setTimeout(renderCard,250);};
 // Latin words stay whole; Korean, Japanese and Chinese wrap per character as before.
 const wrapToken=/[^\s\u2E80-\u9FFF\uAC00-\uD7A3\uF900-\uFAFF\uFF00-\uFFEF]+\s*|[\s\S]/gu;
 function wrap(ctx,text,width){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const token of paragraph.match(wrapToken)||[]){const pieces=ctx.measureText(token.trimEnd()).width>width?[...token]:[token];for(const piece of pieces){if(line.trim()&&ctx.measureText((line+piece).trimEnd()).width>width){lines.push(line.trimEnd());line=piece.trimStart();}else line+=piece;}}lines.push(line.trimEnd());}return lines;}
 async function renderCard(){const ticket=++revision;cardFile=null;$('card-preview').hidden=true;$('share-card').disabled=true;$('download-card').disabled=true;try{
 const {data}=context();const scene=data.scenes.find(s=>s.id===Number(selected[0].closest('.passage').dataset.id));const img=new Image();img.crossOrigin='anonymous';img.src=assetURL(scene.image);await img.decode();await document.fonts.ready;if(ticket!==revision)return;
 const canvas=document.createElement('canvas'),c=canvas.getContext('2d');const width=1200,textWidth=460,note=$('personal-note').value.trim();
 const size=selectionText.length<190?34:selectionText.length<400?30:24,noteSize=22;
 c.font=`${size}px "Noto Serif KR", "AppleMyungjo", serif`;const verseLines=wrap(c,selectionText,textWidth);c.font=`${noteSize}px sans-serif`;const noteLines=note?wrap(c,note,textWidth):[];
 const contentHeight=verseLines.length*size*1.65+noteLines.length*noteSize*1.6+(note?64:0),height=Math.max(675,Math.ceil(contentHeight+220));canvas.width=width;canvas.height=height;
 const scale=Math.max(width/img.width,height/img.height);c.drawImage(img,(width-img.width*scale)/2,(height-img.height*scale)/2,img.width*scale,img.height*scale);
 const shade=c.createLinearGradient(0,0,width,0);shade.addColorStop(0,'rgba(12,27,22,.94)');shade.addColorStop(.38,'rgba(12,27,22,.82)');shade.addColorStop(.57,'rgba(12,27,22,.25)');shade.addColorStop(.75,'rgba(12,27,22,0)');c.fillStyle=shade;c.fillRect(0,0,width,height);
 let y=(height-contentHeight)/2+size*.75;c.fillStyle='#dfcda3';c.font='22px sans-serif';c.fillText(ref(),52,y-46);c.fillStyle='#fff9ec';c.font=`${size}px "Noto Serif KR", "AppleMyungjo", serif`;for(const line of verseLines){c.fillText(line,52,y);y+=size*1.65;}
 if(note){y+=20;c.fillStyle='#dccba3';c.fillRect(52,y,48,2);y+=38;c.fillStyle='#eee8d9';c.font=`${noteSize}px sans-serif`;for(const line of noteLines){c.fillText(line,52,y);y+=noteSize*1.6;}}
 c.fillStyle='#eeddb5';c.font='20px sans-serif';c.textAlign='right';c.fillText('vible.now',1160,height-(context().language==='zh'?84:38));
 if(context().language==='zh'){c.fillStyle='rgba(12,27,22,.88)';c.fillRect(0,height-64,width,64);c.textAlign='left';c.fillStyle='#e7d5ac';c.font='11px sans-serif';const notice=data.attribution+' · Scripture and this card: CC BY-SA 4.0 · https://creativecommons.org/licenses/by-sa/4.0/';wrap(c,notice,1096).forEach((line,i)=>c.fillText(line,52,height-30+i*14));}
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob)throw Error(t().cardFailed);if(cardURL)URL.revokeObjectURL(cardURL);cardURL=URL.createObjectURL(blob);$('card-preview').src=cardURL;$('card-preview').hidden=false;cardFile=new File([blob],`vible-${context().bookId}-${key(selected[0]).replace(':','-')}.png`,{type:'image/png'});$('download-card').disabled=false;$('share-card').disabled=false;
 }catch(e){if(ticket===revision){$('card-preview').hidden=true;status(e.message);}}}
 async function download(){if(!cardFile)return;try{await saveFile(cardFile,cardURL);status(t().cardSaved);}catch(e){if(e.name!=='AbortError')status(t().saveFailed);}}
 $('download-card').onclick=download;
 $('share-card').onclick=async()=>{if(!cardFile)return;try{if(!await shareFile(cardFile)){await download();}}catch(e){if(e.name!=='AbortError')status(t().shareImageFailed);}};
 async function copyLink(){try{await navigator.clipboard.writeText(link());status(t().linkCopied);}catch{$('share-url').focus();$('share-url').select();status(t().copyManually);}}
 $('copy-link').onclick=copyLink;
 $('share-link').onclick=async()=>{try{if(!await shareLink({title:`${ref()} · Vible`,url:link()}))await copyLink();}catch(e){if(e.name!=='AbortError'){if(!$('note-dialog').open)open();status(t().shareLinkFailed);}}};
 $('share-url-selection').onclick=()=>{if(!canShareLink())open();return $('share-link').onclick();};
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#reader, #selection-tools, #note-dialog')){selected=[];selectedRange=null;markSelection();$('selection-tools').hidden=true;}});
 return {shareScene(scene){const limit=Math.min(scene.last,scene.first+2);const nodes=[...$('reader').querySelectorAll('[data-verse]')].filter(p=>Number(p.dataset.chapter)===scene.chapter&&Number(p.dataset.verse)>=scene.first&&Number(p.dataset.endVerse||p.dataset.verse)<=limit);if(!nodes.length)return;pick(nodes);sceneSharing=true;$('selection-tools').hidden=true;return $('share-url-selection').onclick();},editVerse(chapter,verse){const p=$('reader').querySelector(`[data-chapter="${chapter}"][data-verse="${verse}"]`);if(p){pick([p]);open();}},refresh(){selected=[];selectedRange=null;markSelection();$('selection-tools').hidden=true;$('note-dialog').close();revision++;paint();}};
}
