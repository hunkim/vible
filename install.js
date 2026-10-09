const $=id=>document.getElementById(id);
const button=$('install'),dialog=$('install-dialog'),action=$('install-now');
const displayMode=matchMedia('(display-mode: standalone)');
const overlayMode=matchMedia('(display-mode: window-controls-overlay)');
const standalone=()=>displayMode.matches||overlayMode.matches||navigator.standalone;
const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const macSafari=/Mac/.test(navigator.platform)&&/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/.test(navigator.userAgent);
let prompt,installing=false,installed=false;
try{installed=localStorage.getItem('vible-installed')==='true';}catch{}
function rememberInstalled(value){installed=value;try{value?localStorage.setItem('vible-installed','true'):localStorage.removeItem('vible-installed');}catch{}}
const steps=ios?['Safari에서 vible.now를 엽니다.','공유 버튼(□ 위쪽 화살표)을 누릅니다.','“홈 화면에 추가”를 선택하고 “추가”를 누릅니다.']:macSafari?['Safari의 공유 버튼 또는 “파일” 메뉴를 엽니다.','“Dock에 추가”를 선택합니다.','이름을 확인하고 “추가”를 누릅니다.']:['Chrome 또는 Edge에서 vible.now를 엽니다.','주소창의 설치 아이콘 또는 브라우저 메뉴를 누릅니다.','“앱 설치” 또는 “홈 화면에 추가”를 선택합니다.'];
for(const text of steps){const li=document.createElement('li');li.textContent=text;$('install-steps').append(li);}
function update(){
 if(standalone())rememberInstalled(true);
 button.hidden=!!(standalone()||installed);
 button.disabled=installing;
 $('install-label').textContent=installing?'설치 창을 여는 중…':'Vible 앱 설치';
 if(button.hidden){if(dialog.open)dialog.close();return;}
 action.disabled=installing;
 action.hidden=!prompt;
 action.textContent=installing?'설치 창을 여는 중…':prompt?'지금 설치하기':ios?'홈 화면에 추가하기':macSafari?'Dock에 추가하기':'설치 방법 보기';
 $('install-status').textContent=prompt?'버튼을 누르면 기기의 설치 창이 열립니다.':ios?'Safari의 공유 메뉴에서 추가할 수 있습니다.':macSafari?'Safari 메뉴에서 앱으로 추가할 수 있습니다.':'설치 메뉴는 Chrome 또는 Edge에서 확인할 수 있습니다.';
 if(prompt)$('install-instructions').hidden=true;
}
function open(){update();if(!button.hidden&&!dialog.open)dialog.showModal();}
function dismiss(){dialog.close();}
button.onclick=()=>{
 if(button.hidden||installing)return;
 if(prompt)return requestInstall();
 open();$('install-instructions').hidden=false;
};
$('close-install').onclick=dismiss;
$('install-later').onclick=dismiss;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();rememberInstalled(false);prompt=e;update();});
window.addEventListener('appinstalled',()=>{rememberInstalled(true);prompt=null;update();});
displayMode.addEventListener('change',update);
overlayMode.addEventListener('change',update);
async function requestInstall(){
 if(button.hidden||installing)return;
 if(!prompt){$('install-instructions').hidden=false;$('install-instructions').focus();return;}
 const pending=prompt;prompt=null;installing=true;update();
 try{
  await pending.prompt();
  const choice=await pending.userChoice;
  if(choice.outcome==='accepted'){dialog.close();}
  else{open();$('install-instructions').hidden=false;}
 }catch{open();$('install-instructions').hidden=false;}
 finally{installing=false;update();}
}
action.onclick=requestInstall;
update();
if('serviceWorker' in navigator&&!new URLSearchParams(location.search).has('preview'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
