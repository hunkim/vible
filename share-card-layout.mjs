// Keep crawler metadata and the rendered PNG dimensions identical.
export function cardLayout(s){
 const width=1200,textWidth=460;
 const size=s.text.length<190?34:s.text.length<400?30:24;
 const charsPerLine=(s.lang==='en'?1.8:1)*(textWidth/size);
 const lines=s.verses.reduce((n,v)=>n+Math.ceil(v.text.length/charsPerLine),0);
 const height=Math.max(675,Math.ceil(200+lines*size*1.65+Math.max(0,s.verses.length-1)*16));
 return {width,height,size,textWidth};
}
