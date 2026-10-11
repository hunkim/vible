import {isNative} from './platform.js';
const $=id=>document.getElementById(id);
const button=$('install'),dialog=$('install-dialog'),action=$('install-now');
const displayMode=matchMedia('(display-mode: standalone)');
const overlayMode=matchMedia('(display-mode: window-controls-overlay)');
const standalone=()=>isNative||displayMode.matches||overlayMode.matches||navigator.standalone;
const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const macSafari=/Mac/.test(navigator.platform)&&/Safari/.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/.test(navigator.userAgent);
let prompt,installing=false,installed=false;
try{installed=localStorage.getItem('vible-installed')==='true';}catch{}
function rememberInstalled(value){installed=value;try{value?localStorage.setItem('vible-installed','true'):localStorage.removeItem('vible-installed');}catch{}}
// Browser installation help in each reading language; the app sets <html lang> when the language changes.
const installCopy={
 ko:{steps:{ios:['Safari에서 vible.now를 엽니다.','공유 버튼(□ 위쪽 화살표)을 누릅니다.','“홈 화면에 추가”를 선택하고 “추가”를 누릅니다.'],mac:['Safari의 공유 버튼 또는 “파일” 메뉴를 엽니다.','“Dock에 추가”를 선택합니다.','이름을 확인하고 “추가”를 누릅니다.'],other:['Chrome 또는 Edge에서 vible.now를 엽니다.','주소창의 설치 아이콘 또는 브라우저 메뉴를 누릅니다.','“앱 설치” 또는 “홈 화면에 추가”를 선택합니다.']},opening:'설치 창을 여는 중…',install:'Vible 앱 설치',now:'지금 설치하기',ios:'홈 화면에 추가하기',mac:'Dock에 추가하기',other:'설치 방법 보기',status:{prompt:'버튼을 누르면 기기의 설치 창이 열립니다.',ios:'Safari의 공유 메뉴에서 추가할 수 있습니다.',mac:'Safari 메뉴에서 앱으로 추가할 수 있습니다.',other:'설치 메뉴는 Chrome 또는 Edge에서 확인할 수 있습니다.'}},
 en:{steps:{ios:['Open vible.now in Safari.','Tap the Share button (square with an up arrow).','Choose “Add to Home Screen”, then tap “Add”.'],mac:['Open Safari’s Share button or the File menu.','Choose “Add to Dock”.','Check the name and click “Add”.'],other:['Open vible.now in Chrome or Edge.','Click the install icon in the address bar or open the browser menu.','Choose “Install app” or “Add to Home screen”.']},opening:'Opening installer…',install:'Install Vible',now:'Install now',ios:'Add to Home Screen',mac:'Add to Dock',other:'How to install',status:{prompt:'The button opens your device’s install prompt.',ios:'Add it from Safari’s Share menu.',mac:'Add it as an app from the Safari menu.',other:'The install option is in Chrome or Edge.'}},
 ja:{steps:{ios:['Safariでvible.nowを開きます。','共有ボタン（□と上向き矢印）を押します。','「ホーム画面に追加」を選び、「追加」を押します。'],mac:['Safariの共有ボタンまたは「ファイル」メニューを開きます。','「Dockに追加」を選びます。','名前を確認して「追加」を押します。'],other:['ChromeまたはEdgeでvible.nowを開きます。','アドレスバーのインストールアイコンまたはブラウザのメニューを押します。','「アプリをインストール」または「ホーム画面に追加」を選びます。']},opening:'インストール画面を開いています…',install:'Vibleをインストール',now:'今すぐインストール',ios:'ホーム画面に追加',mac:'Dockに追加',other:'インストール方法',status:{prompt:'ボタンを押すと端末のインストール画面が開きます。',ios:'Safariの共有メニューから追加できます。',mac:'Safariのメニューからアプリとして追加できます。',other:'インストールはChromeまたはEdgeのメニューから行えます。'}},
 zh:{steps:{ios:['在 Safari 中打开 vible.now。','点按“分享”按钮（方框加向上箭头）。','选择“添加到主屏幕”，然后点按“添加”。'],mac:['打开 Safari 的“分享”按钮或“文件”菜单。','选择“添加到程序坞”。','确认名称后点按“添加”。'],other:['在 Chrome 或 Edge 中打开 vible.now。','点击地址栏中的安装图标或打开浏览器菜单。','选择“安装应用”或“添加到主屏幕”。']},opening:'正在打开安装窗口…',install:'安装 Vible',now:'立即安装',ios:'添加到主屏幕',mac:'添加到程序坞',other:'查看安装方法',status:{prompt:'点击按钮将打开设备的安装窗口。',ios:'可从 Safari 的分享菜单添加。',mac:'可从 Safari 菜单添加为应用。',other:'安装选项位于 Chrome 或 Edge 的菜单中。'}}
};
const device=ios?'ios':macSafari?'mac':'other';
const copy=()=>installCopy[document.documentElement?.lang]||installCopy.ko;
function renderSteps(){$('install-steps').replaceChildren(...copy().steps[device].map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
renderSteps();
function update(){
 if(standalone())rememberInstalled(true);
 button.hidden=!!(standalone()||installed);
 button.disabled=installing;
 const c=copy();
 $('install-label').textContent=installing?c.opening:c.install;
 if(button.hidden){if(dialog.open)dialog.close();return;}
 action.disabled=installing;
 action.hidden=!prompt;
 action.textContent=installing?c.opening:prompt?c.now:c[device];
 $('install-status').textContent=c.status[prompt?'prompt':device];
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
export function localizeInstall(){renderSteps();update();}
// Store apps bundle their files, and iOS app webviews cannot run service workers.
if(!isNative&&'serviceWorker' in navigator&&!new URLSearchParams(location.search).has('preview'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
