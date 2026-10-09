export const languages=['ko','en','ja','zh'];
export const languageNames={ko:'한국어',en:'English',ja:'日本語',zh:'中文'};
export function normalizeLanguage(value){const code=String(value||'').toLowerCase().split(/[-_]/)[0];return languages.includes(code)?code:null;}
export function initialLanguage({url='',saved='',locales=[]}={}){return normalizeLanguage(url)||normalizeLanguage(saved)||locales.map(normalizeLanguage).find(Boolean)||'ko';}
export function passageURL(book,chapter,verse,endChapter=chapter,endVerse=verse,lang='ko'){
 const start=`/share/${book}/${chapter}/${verse}`,path=Number(chapter)===Number(endChapter)&&Number(verse)===Number(endVerse)?start:`${start}/${endChapter}/${endVerse}`;
 return lang==='ko'?path:`${path}?lang=${lang}`;
}
export const bookNames={ko:{'1corinthians':'고린도전서',matthew:'마태복음',mark:'마가복음',luke:'누가복음',genesis:'창세기',john:'요한복음',acts:'사도행전',romans:'로마서',revelation:'요한계시록'},en:{'1corinthians':'1 Corinthians',matthew:'Matthew',mark:'Mark',luke:'Luke',genesis:'Genesis',john:'John',acts:'Acts',romans:'Romans',revelation:'Revelation'},ja:{'1corinthians':'コリントの信徒への手紙一',matthew:'マタイによる福音書',mark:'マルコによる福音書',luke:'ルカによる福音書',genesis:'創世記',john:'ヨハネによる福音書',acts:'使徒言行録',romans:'ローマの信徒への手紙',revelation:'ヨハネの黙示録'},zh:{'1corinthians':'哥林多前书',matthew:'马太福音',mark:'马可福音',luke:'路加福音',genesis:'创世记',john:'约翰福音',acts:'使徒行传',romans:'罗马书',revelation:'启示录'}};
export const messages={
 ko:{language:'언어 선택',unavailable:'이 언어의 성경 번역은 사용 허가와 본문 연결을 준비 중입니다. 현재 본문 언어는 그대로 유지됩니다.',loading:'본문을 불러오는 중입니다…',chapter:n=>`${n}장`,end:'마지막 말씀까지 읽었습니다.',all:'전체',previous:'이전',next:'다음',read:'읽기',story:'전체 흐름',gallery:'장면 지도',source:'본문 출처',shareHeading:'말씀을 마음에 담다',received:'당신에게 전해진 말씀',continue:'이 말씀 이어 읽기',invitation:'이 말씀을 소중한 사람에게 전해 보세요.',saveCard:'카드 저장',share:'말씀 나누기',copied:'말씀 링크를 복사했습니다.',copyHelp:'이 말씀의 주소를 복사해 주세요.',cardAlt:'말씀 카드',scenes:n=>`${n}개 장면`,selectVerse:(c,v)=>`${c}장 ${v}절 선택`},
 en:{language:'Language',unavailable:'This Bible translation is awaiting licensing and text integration. Your current reading language has been kept.',loading:'Loading Scripture…',chapter:n=>`Chapter ${n}`,end:'You have reached the end of this book.',all:'All',previous:'Previous',next:'Next',read:'Read',story:'Overview',gallery:'Scenes',source:'Translation & sources',shareHeading:'Keep the Word in your heart',received:'Scripture shared with you',continue:'Continue reading',invitation:'Share these words with someone you love.',saveCard:'Save card',share:'Share Scripture',copied:'Scripture link copied.',copyHelp:'Copy this Scripture link.',cardAlt:'Scripture card',scenes:n=>`${n} scenes`,selectVerse:(c,v)=>`Select ${c}:${v}`},
 ja:{language:'言語',unavailable:'この言語の聖書本文は、利用許諾と導入を準備中です。現在の本文の言語は維持されます。',loading:'聖書本文を読み込み中…',chapter:n=>`${n}章`,end:'この書の最後まで読みました。',all:'すべて',previous:'前へ',next:'次へ',read:'読む',story:'全体の流れ',gallery:'場面',source:'翻訳・出典',shareHeading:'みことばを心に',received:'あなたに届いたみことば',continue:'続きを読む',invitation:'大切な人に、このみことばを届けましょう。',saveCard:'カードを保存',share:'みことばを共有',copied:'みことばのリンクをコピーしました。',copyHelp:'みことばのリンクをコピーしてください。',cardAlt:'みことばカード',scenes:n=>`${n}の場面`,selectVerse:(c,v)=>`${c}章${v}節を選択`},
 zh:{language:'语言',unavailable:'此语言的圣经译本正在准备授权及正文接入。当前阅读语言将保持不变。',loading:'正在加载经文…',chapter:n=>`第${n}章`,end:'已读到本书的最后一节。',all:'全部',previous:'上一段',next:'下一段',read:'阅读',story:'全书概览',gallery:'场景',source:'译本与来源',shareHeading:'将神的话存记在心',received:'分享给你的经文',continue:'继续阅读',invitation:'将这段经文分享给你珍爱的人。',saveCard:'保存卡片',share:'分享经文',copied:'已复制经文链接。',copyHelp:'请复制这段经文的链接。',cardAlt:'经文卡片',scenes:n=>`${n}个场景`,selectVerse:(c,v)=>`选择${c}章${v}节`}
};
export function applyTranslation(base,translation,lang){
 if(!languages.includes(lang)||translation.language!==lang)throw Error('Translation language mismatch');
 for(const key of ['book','translation','attribution','source','licenseSource'])if(typeof translation[key]!=='string'||!translation[key].trim())throw Error(`Missing translation metadata: ${key}`);
 if(!translation.permissions?.display||!translation.permissions?.shareCards)throw Error('Translation display and card-sharing permissions are required');
 if(translation.chapters?.length!==base.chapters)throw Error('Incomplete translation chapters');
 const chapters=new Map();
 for(const c of translation.chapters){
  if(!Number.isInteger(c.chapter)||c.chapter<1||c.chapter>base.chapters||chapters.has(c.chapter))throw Error('Invalid translation chapter');
  const verses=new Map();
  for(const v of c.verses||[]){if(!Number.isInteger(v.verse)||v.verse<1||verses.has(v.verse)||typeof v.text!=='string'||(!v.text.trim()&&!v.omitted))throw Error('Invalid translation verse');verses.set(v.verse,v);}
  chapters.set(c.chapter,verses);
 }
 const scenes=base.scenes.map(s=>({...s,source:translation.chapterSources?.[s.chapter]||translation.source,title:translation.sceneTitles?.[s.id]||(lang==='ko'?s.title:`${translation.book} ${s.chapter}:${s.first}${s.last===s.first?'':`–${s.last}`}`),verses:s.verses.map(v=>{
  const translated=chapters.get(s.chapter)?.get(v.verse);if(!translated)throw Error(`Missing translation verse ${s.chapter}:${v.verse}`);
  return {verse:v.verse,text:translated.text,omitted:!!translated.omitted,...(translated.endVerse?{endVerse:translated.endVerse}:{}),...(translated.combinedWith?{combinedWith:translated.combinedWith}:{})};
 })}));
 return {...base,book:translation.book,translation:translation.translation,attribution:translation.attribution,source:translation.source,copyrightSource:translation.licenseSource,language:lang,scenes};
}
export const interfaceCopy={
 ko:{notes:'나의 노트 · 하이라이트',help:'말씀을 선택하거나 절 번호를 누르면 하이라이트, 노트, URL·카드 공유 도구가 나타납니다.',hideText:'글씨 숨기고 그림만 보기',showText:'글씨 다시 보기',menu:'메뉴 열기',closeMenu:'메뉴 닫기',saveNote:'노트 저장',imageShare:'이미지 공유',linkShare:'링크 공유',saveImage:'이미지 저장',copyLink:'URL 복사',reflection:'나의 묵상',placeholder:'이 말씀을 통해 마음에 남은 것을 적어 보세요.',install:'Vible 앱 설치'},
 en:{notes:'My notes & highlights',help:'Select Scripture or tap a verse number to highlight, take notes, or share a link or card.',hideText:'Hide text to view the image',showText:'Show Scripture',menu:'Open menu',closeMenu:'Close menu',saveNote:'Save note',imageShare:'Share image',linkShare:'Share link',saveImage:'Save image',copyLink:'Copy link',reflection:'My reflection',placeholder:'Write what these words mean to you.',install:'Install Vible'},
 ja:{notes:'ノート・ハイライト',help:'本文を選択するか節番号を押すと、ハイライト、ノート、リンク・カード共有ができます。',hideText:'本文を隠して絵を見る',showText:'本文を表示',menu:'メニューを開く',closeMenu:'メニューを閉じる',saveNote:'ノートを保存',imageShare:'画像を共有',linkShare:'リンクを共有',saveImage:'画像を保存',copyLink:'リンクをコピー',reflection:'私の黙想',placeholder:'このみことばから心に残ったことを書いてください。',install:'Vibleをインストール'},
 zh:{notes:'我的笔记与标记',help:'选择经文或点击节号，即可标记、写笔记、分享链接或经文卡片。',hideText:'隐藏文字，欣赏图片',showText:'显示经文',menu:'打开菜单',closeMenu:'关闭菜单',saveNote:'保存笔记',imageShare:'分享图片',linkShare:'分享链接',saveImage:'保存图片',copyLink:'复制链接',reflection:'我的默想',placeholder:'记下这段经文带给你的感动。',install:'安装 Vible'}
};
