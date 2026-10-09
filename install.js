const button=document.getElementById('install'),dialog=document.getElementById('install-dialog');let prompt;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function update(){button.hidden=!!standalone();}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();prompt=e;update();});
window.addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;});
matchMedia('(display-mode: standalone)').addEventListener('change',update);
button.onclick=async()=>{if(prompt){const pending=prompt;prompt=null;await pending.prompt();await pending.userChoice;return;}document.getElementById('install-help').textContent=(/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))?'Safari의 공유 버튼을 누르고 “홈 화면에 추가”를 선택해 주세요.':'브라우저 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택해 주세요. 설치 메뉴가 없다면 Chrome 또는 Safari로 열어 주세요.';dialog.showModal();};
document.getElementById('close-install').onclick=()=>dialog.close();update();
if('serviceWorker' in navigator&&!new URLSearchParams(location.search).has('preview'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
