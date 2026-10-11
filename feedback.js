import {apiURL} from './platform.js';
export const feedbackCopy={
 ko:{title:'의견 보내기',label:'어떤 점을 고치면 좋을까요?',placeholder:'예: 손가락이 이상해요, 구절과 그림이 맞지 않아요',send:'보내기',sending:'보내는 중…',close:'닫기',thanks:'알려주셔서 감사합니다',received:'의견이 접수됐습니다. 말씀과 그림을 확인하고 개선하겠습니다.',error:'보내지 못했습니다. 입력한 내용은 남아 있어요. 다시 시도해 주세요.',offline:'인터넷에 연결한 후 다시 보내 주세요.',limit:'잠시 후 다시 보내 주세요.',empty:'발견한 문제나 의견을 적어 주세요.'},
 en:{title:'Send feedback',label:'What could we improve?',placeholder:'For example: the hand looks unusual, or the image does not match the passage',send:'Send',sending:'Sending…',close:'Close',thanks:'Thank you for letting us know',received:'Your feedback was received. We will review the passage and image.',error:'Could not send. Your text is still here. Please try again.',offline:'Connect to the internet and try again.',limit:'Please try again later.',empty:'Please describe the issue or your suggestion.'},
 ja:{title:'意見を送る',label:'改善してほしい点はありますか？',placeholder:'例：手の形が不自然、絵が聖句に合っていない',send:'送信',sending:'送信中…',close:'閉じる',thanks:'お知らせいただきありがとうございます',received:'ご意見を受け付けました。聖句と絵を確認します。',error:'送信できませんでした。入力内容は残っています。もう一度お試しください。',offline:'インターネットに接続してから再送信してください。',limit:'しばらくしてからお試しください。',empty:'問題やご意見を入力してください。'},
 zh:{title:'发送反馈',label:'您希望改进哪些地方？',placeholder:'例如：手的形状不自然，或图片与经文不符',send:'发送',sending:'正在发送…',close:'关闭',thanks:'感谢您的反馈',received:'您的反馈已收到。我们会核对经文和图片。',error:'发送失败。输入内容已保留，请重试。',offline:'请连接网络后重试。',limit:'请稍后重试。',empty:'请填写问题或建议。'}
};
export function sceneFeedback(getContext){
 const $=id=>document.getElementById(id),dialog=$('feedback-dialog'),form=$('feedback-form'),input=$('feedback-message'),send=$('send-feedback'),status=$('feedback-status'),toggle=$('feedback-scene');
 let target=null,pending=false,requestId='',key='';
 const copy=()=>feedbackCopy[target?.language||getContext().language]||feedbackCopy.ko;
 function localize(){const c=copy();toggle.title=c.title;toggle.setAttribute('aria-label',c.title);}
 function close(){if(!pending)dialog.close();}
 toggle.onclick=()=>{
  const context=getContext();if(!context.scene)return;
  target={...context,scene:{...context.scene}};const nextKey=`${target.bookId}:${target.scene.chapter}:${target.scene.first}:${target.language}`;
  if(nextKey!==key){input.value='';key=nextKey;}requestId=crypto.randomUUID();
  const c=copy();$('feedback-title').textContent=c.title;$('feedback-reference').textContent=target.reference;
  $('feedback-label').textContent=c.label;input.placeholder=c.placeholder;
  $('close-feedback').setAttribute('aria-label',c.close);$('feedback-thanks').textContent=c.thanks;$('feedback-received').textContent=c.received;$('feedback-done').textContent=c.close;
  status.textContent='';form.hidden=false;$('feedback-success').hidden=true;send.textContent=c.send;send.disabled=false;dialog.showModal();input.focus();
 };
 $('close-feedback').onclick=close;$('feedback-done').onclick=close;
 dialog.addEventListener('cancel',e=>{if(pending)e.preventDefault();});
 dialog.addEventListener('close',()=>toggle.focus({preventScroll:true}));
 dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))close();});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(pending)return;const c=copy(),message=input.value.trim();
  if(!message){status.textContent=c.empty;input.focus();return;}
  if(navigator.onLine===false){status.textContent=c.offline;return;}
  pending=true;send.disabled=true;$('close-feedback').disabled=true;send.textContent=c.sending;status.textContent='';
  try{
   const response=await fetch(apiURL('/api/feedback'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book:target.bookId,chapter:target.scene.chapter,verse:target.scene.first,lang:target.language,message,requestId}),signal:AbortSignal.timeout(15000)});
   if(!response.ok){status.textContent=response.status===429?c.limit:c.error;return;}
   const receipt=await response.json();if(!receipt.ok||!receipt.id)throw Error('Missing receipt');
   form.hidden=true;$('feedback-success').hidden=false;input.value='';$('feedback-done').focus();
  }catch{status.textContent=c.error;}
  finally{pending=false;send.disabled=false;$('close-feedback').disabled=false;send.textContent=c.send;}
 });
 input.addEventListener('input',()=>{status.textContent='';});
 return {localize};
}
