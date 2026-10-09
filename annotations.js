const $=id=>document.getElementById(id);
export function annotations(context){
 let selected=[],selectionText='',cardFile=null,cardURL='',revision=0,selectionTimer,noteTimer;
 const storageKey=()=>`vible-notes-${context().bookId}`;
 const records=()=>{try{return JSON.parse(localStorage.getItem(storageKey())||'{}');}catch{return {};}};
 const key=p=>`${p.dataset.chapter}:${p.dataset.verse}`;
 const status=t=>$('note-status').textContent=t;
 function paint(){const notes=records();for(const p of $('reader').querySelectorAll('[data-verse]')){p.classList.toggle('highlighted',!!notes[key(p)]?.highlight);p.classList.toggle('has-note',!!notes[key(p)]?.note);}}
 function pick(nodes,text=''){selected=nodes;selectionText=text||nodes.map(p=>p.querySelector('.verse-text').textContent).join('\n');$('selection-tools').hidden=!nodes.length;}
 function capture(){if($('note-dialog').open)return;const sel=window.getSelection();if(!sel?.rangeCount||sel.isCollapsed)return;const range=sel.getRangeAt(0);if(!$('reader').contains(range.startContainer)||!$('reader').contains(range.endContainer))return;const nodes=[...$('reader').querySelectorAll('[data-verse]')].filter(p=>range.intersectsNode(p.querySelector('.verse-text')));if(nodes.length)pick(nodes);}
 document.addEventListener('selectionchange',()=>{if($('note-dialog').open)return;clearTimeout(selectionTimer);selectionTimer=setTimeout(capture,120);});
 $('reader').addEventListener('click',e=>{const b=e.target.closest('.verse-number');if(b)pick([b.closest('[data-verse]')]);});
 function save(change){const notes=records();for(const p of selected)notes[key(p)]={...notes[key(p)],...change};try{localStorage.setItem(storageKey(),JSON.stringify(notes));paint();return true;}catch{status('저장 공간을 사용할 수 없습니다. 카드 다운로드는 가능합니다.');return false;}}
 $('highlight-selection').onclick=()=>{const notes=records();const highlighted=selected.every(p=>notes[key(p)]?.highlight);save({highlight:!highlighted});};
 $('dismiss-selection').onclick=()=>{$('selection-tools').hidden=true;window.getSelection()?.removeAllRanges();selected=[];};
 function ref(){const {data}=context();const first=selected[0],last=selected.at(-1);return `${data.book} ${key(first)}${first===last?'':`–${first.dataset.chapter===last.dataset.chapter?last.dataset.verse:key(last)}`}`;}
 function link(){const p=selected[0];return `https://vible.now/?book=${context().bookId}&chapter=${p.dataset.chapter}&verse=${p.dataset.verse}`;}
 function open(){if(!selected.length)return;$('selected-reference').textContent=ref();$('selected-scripture').textContent=selectionText;$('personal-note').value=records()[key(selected[0])]?.note||'';status('노트는 이 기기에 저장됩니다. 공유 버튼을 누를 때만 공유됩니다.');$('note-dialog').showModal();renderCard();}
 $('note-selection').onclick=open;$('share-selection').onclick=open;
 $('close-note').onclick=()=>$('note-dialog').close();$('save-note').onclick=()=>{if(save({note:$('personal-note').value,highlight:true}))status('말씀과 노트를 이 기기에 저장했습니다.');};
 $('personal-note').oninput=()=>{cardFile=null;$('share-card').disabled=true;$('download-card').disabled=true;clearTimeout(noteTimer);noteTimer=setTimeout(renderCard,250);};
 function wrap(ctx,text,width){const lines=[];for(const paragraph of text.split('\n')){let line='';for(const ch of paragraph){if(line&&ctx.measureText(line+ch).width>width){lines.push(line);line=ch;}else line+=ch;}lines.push(line);}return lines;}
 async function renderCard(){const ticket=++revision;cardFile=null;$('card-preview').hidden=true;$('share-card').disabled=true;$('download-card').disabled=true;try{
 const {data}=context();const scene=data.scenes.find(s=>s.id===Number(selected[0].closest('.passage').dataset.id));const img=new Image();img.src=`assets/${scene.image}`;await img.decode();await document.fonts.ready;if(ticket!==revision)return;
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const c=canvas.getContext('2d');const scale=Math.max(1080/img.width,1350/img.height);c.drawImage(img,(1080-img.width*scale)*.68,(1350-img.height*scale)/2,img.width*scale,img.height*scale);
 const shade=c.createLinearGradient(0,0,0,1350);shade.addColorStop(0,'rgba(12,27,22,.16)');shade.addColorStop(.3,'rgba(12,27,22,.58)');shade.addColorStop(1,'rgba(12,27,22,.96)');c.fillStyle=shade;c.fillRect(0,0,1080,1350);
 const note=$('personal-note').value.trim();let size=54,verseLines,noteLines,height;do{c.font=`${size}px "Noto Serif KR", "AppleMyungjo", serif`;verseLines=wrap(c,selectionText,904);c.font=`${Math.max(28,size*.67)}px sans-serif`;noteLines=note?wrap(c,note,904):[];height=verseLines.length*size*1.55+noteLines.length*Math.max(28,size*.67)*1.55+(note?80:0);if(height<=920)break;size-=2;}while(size>=28);
 if(height>920)throw Error('한 카드에 담기에는 말씀이 길어요. 더 짧은 구절을 선택해 주세요.');
 let y=Math.max(280,1170-height);c.fillStyle='#dfcda3';c.font='30px sans-serif';c.fillText(ref(),88,y-58);c.fillStyle='#fff9ec';c.font=`${size}px "Noto Serif KR", "AppleMyungjo", serif`;for(const line of verseLines){c.fillText(line,88,y);y+=size*1.55;}
 if(note){y+=38;c.fillStyle='#dccba3';c.fillRect(88,y-12,60,2);y+=36;c.fillStyle='#eee8d9';c.font=`${Math.max(28,size*.67)}px sans-serif`;for(const line of noteLines){c.fillText(line,88,y);y+=Math.max(28,size*.67)*1.55;}}
 c.fillStyle='#eeddb5';c.font='34px sans-serif';c.fillText('Vible',88,1280);c.font='27px sans-serif';c.textAlign='right';c.fillText('vible.now',992,1280);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(ticket!==revision)return;if(!blob)throw Error('카드를 만들지 못했습니다.');if(cardURL)URL.revokeObjectURL(cardURL);cardURL=URL.createObjectURL(blob);$('card-preview').src=cardURL;$('card-preview').hidden=false;cardFile=new File([blob],`vible-${context().bookId}-${key(selected[0]).replace(':','-')}.png`,{type:'image/png'});$('download-card').disabled=false;$('share-card').disabled=false;
 }catch(e){if(ticket===revision){$('card-preview').hidden=true;status(e.message);}}}
 function download(){if(!cardFile)return;const a=document.createElement('a');a.href=cardURL;a.download=cardFile.name;a.click();status('카드 이미지를 저장했습니다. 원하는 SNS에 올려 주세요.');}
 $('download-card').onclick=download;
 $('share-card').onclick=async()=>{if(!cardFile)return;try{if(navigator.canShare?.({files:[cardFile]})){await navigator.share({files:[cardFile],title:ref(),text:`${ref()} · Vible`,url:link()});}else{download();status('이 브라우저에서는 카드 다운로드 후 SNS에 올릴 수 있습니다.');}}catch(e){if(e.name!=='AbortError')status('공유 창을 열지 못했습니다. 카드 다운로드를 이용해 주세요.');}};
 $('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(link());status('선택한 말씀의 링크를 복사했습니다.');}catch{status(link());}};
 return {refresh(){selected=[];$('selection-tools').hidden=true;$('note-dialog').close();revision++;paint();}};
}
