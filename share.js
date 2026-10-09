import {messages} from './languages.js';
const t=messages[document.documentElement.lang]||messages.ko;
const button=document.getElementById('share-passage'),status=document.getElementById('share-status');
button.onclick=async()=>{
 try{
  if(navigator.share)await navigator.share({title:button.dataset.title,url:button.dataset.url});
  else{await navigator.clipboard.writeText(button.dataset.url);status.textContent=t.copied;}
 }catch(e){if(e.name!=='AbortError'){status.replaceChildren(t.copyHelp+' ');const input=document.createElement('input');input.value=button.dataset.url;input.readOnly=true;input.setAttribute('aria-label',t.copyHelp);status.append(input);input.focus();input.select();}}
};
