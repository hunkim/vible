# Usage: python3 import-jesus-words.py /path/to/BSB_usfm.zip (BSB Publishing v5.16)
import re,zipfile,json
from pathlib import Path
import sys
root=Path(__file__).resolve().parent
z=zipfile.ZipFile(sys.argv[1])
out={}
def clean(s):
 s=re.sub(r'\\[fx] .*?\\[fx]\*','',s,flags=re.S)
 s=re.sub(r'\\(?:s\d|r|d|ms\d) [^\n]*','',s)
 s=re.sub(r'\\[a-z][a-z0-9]*\*','',s)
 s=re.sub(r'\\[a-z][a-z0-9]* ?','',s)
 return re.sub(r'\s+',' ',s).strip()
for book,code in [('john','JHN'),('acts','ACT'),('romans','ROM'),('revelation','REV')]:
 result={};text=z.read(code+'.usfm').decode('utf-8-sig')
 chunks=re.split(r'\\c (\d+)\s*',text)
 for i in range(1,len(chunks),2):
  c=int(chunks[i]);vs=re.split(r'\\v (\d+(?:-\d+)?)\s*',chunks[i+1])
  for j in range(1,len(vs),2):
   raw=vs[j+1];spans=[clean(m.group(1)) for m in re.finditer(r'\\wj (.*?)\\wj\*',raw,re.S)]
   if not spans:continue
   en=json.loads((root/f'data/translations/en/{book}.json').read_text())
   existing=next((v['text'] for ch in en['chapters'] if ch['chapter']==c for v in ch['verses'] if str(v['verse'])==vs[j]),None)
   full=clean(raw);result[f'{c}:{vs[j]}']={'full':full,'spans':spans,'mode':'full' if not clean(re.sub(r'\\wj .*?\\wj\*','',raw,flags=re.S)) else 'partial','existing':existing}
 out[book]=result
red=out
data={lang:{} for lang in ['ko','en','ja','zh']};review=[];issues=[]
def fingerprint(s):
 h=2166136261
 for c in s:
  h=((h^ord(c))*16777619)&0xffffffff
 return h

def norm(s):
 indices=[i for i,c in enumerate(s) if c.isalnum()];return ''.join(s[i].lower() for i in indices),indices

def quotes(s,lang):
 left,right=('「','」') if lang=='ja' else ('“','”');out=[];start=None;level=0
 for i,c in enumerate(s):
  if c==left:
   if not level:start=i
   level+=1
  elif c==right and level:
   level-=1
   if not level:out.append([start,i+1])
 if level:out.append([start,len(s)])
 if not out:
  left,right=('『','』') if lang=='ja' else ('‘','’')
  out=[[m.start(),m.end()] for m in re.finditer(re.escape(left)+'.*?(?:'+re.escape(right)+'|$)',s)]
 return out
# Korean has no quotation marks: audited exceptions to introductory/suffix narration rules.
ko_overrides={
 'john':{
 '1:38':['무엇을 구하느냐'],'1:39':['와 보라'],'4:7':['물을 좀 달라'],'4:53':['네 아들이 살았다'],
 '5:11':['자리를 들고 걸어가라'],'6:41':['하늘로서 내려온 떡이라'],'6:42':['하늘로서 내려왔다'],
 '7:36':['나를 찾아도 만나지 못할 터이요 나 있는 곳에 오지도 못하리라'],
 '8:22':['나의 가는 곳에는 너희가 오지 못하리라'],'8:41':['너희는 너희 아비의 행사를 하는도다'],
 '11:34':['그를 어디 두었느냐'],'11:43':['나사로야 나오라'],'12:28':['아버지여 아버지의 이름을 영광스럽게 하옵소서'],
 '12:36':['너희에게 아직 빛이 있을 동안에 빛을 믿으라 그리하면 빛의 아들이 되리라'],
 '13:11':['다는 깨끗지 아니하다'],
 '16:17':['조금 있으면 나를 보지 못하겠고 또 조금 있으면 나를 보리라','내가 아버지께로 감이라'],
 '16:18':['조금 있으면이라'],'18:6':['내로라'],'18:7':['누구를 찾느냐'],
 '18:9':['아버지께서 내게 주신 자 중에서 하나도 잃지 아니하였삽나이다'],'20:15':['여자여 어찌하여 울며 누구를 찾느냐'],'20:16':['마리아야'],
 '21:5':['얘들아 너희에게 고기가 있느냐'],
 '21:15':['요한의 아들 시몬아 네가 이 사람들보다 나를 더 사랑하느냐','내 어린 양을 먹이라'],
 '21:16':['요한의 아들 시몬아 네가 나를 사랑하느냐','내 양을 치라'],
 '21:17':['요한의 아들 시몬아 네가 나를 사랑하느냐','네가 나를 사랑하느냐','내 양을 먹이라'],
 '21:23':['내가 올 때까지 그를 머물게 하고자 할지라도 네게 무슨 상관이냐']},
 'acts':{'26:14':['사울아 사울아 네가 어찌하여 나를 핍박하느냐 가시채를 뒷발질하기가 네게 고생이니라'],'20:35':['주는 것이 받는 것보다 복이 있다'],'11:16':['요한은 물로 세례를 주었으나 너희는 성령으로 세례 받으리라']},
 'revelation':{},'romans':{}}
quote_indices={'1:38':[0],'9:7':[0],'4:50':[0],'8:11':[1],'8:19':[1],'8:39':[1],'11:39':[0],'18:37':[1],'20:15':[0],'20:16':[0],'21:12':[0],'21:15':[0,2],'21:16':[0,2]}
phrases={
 'ja':{'john':{'9:7':['行って、シロアム','の池で洗いなさい。'],'5:11':['『床を取り上げて歩け。』'],'6:42':['『わたしは天から下って来た。』'],'7:36':['『あなたがたはわたしを捜すが、見いだすことはない。』','『わたしのいる所にあなたがたは来ることができない。』'],'8:22':['『わたしが行く所に、あなたがたは来ることができない。』'],'16:18':['しばらくすると']},'acts':{'18:10':['わたしがあなたとともにいるのだ。だれもあなたを襲って、危害を加える者はない。この町には、わたしの民がたくさんいるから。']}},
 'zh':{'john':{'5:11':['拿起垫子走'],'6:41':['从天上降下来的粮'],'6:42':['从天上降下来的'],'7:36':['我们找不到祂，又不能去祂所在的地方'],'8:22':['祂去的地方我们不能去'],'16:18':['‘不久’']},'acts':{'9:10':[]}}
}
# Only Jesus or an explicit quotation of his words; unidentified heavenly voices are excluded.
for ref in ['10:13','10:15','11:7','11:9']:red['acts'].pop(ref,None)
for book,items in red.items():
 raw=json.loads((root/f'data/{book}.json').read_text())
 texts={'ko':{f"{s['chapter']}:{v['verse']}":v['text'] for s in raw['scenes'] for v in s['verses']}}
 for lang in ['en','ja','zh']:
  t=json.loads((root/f'data/translations/{lang}/{book}.json').read_text());texts[lang]={f"{c['chapter']}:{v['verse']}":v['text'] for c in t['chapters'] for v in c['verses']}
 for lang in data:data[lang][book]={}
 for ref,r in items.items():
  english=texts['en'][ref];en_ranges=[]
  if r['mode']=='full':en_ranges=[[0,len(english)]]
  else:
   normalized,indices=norm(english);pos=0
   for speech in r['spans']:
    target,_=norm(speech);i=normalized.find(target,pos)
    if i<0:
     if book=='john' and ref=='2:4':en_ranges=quotes(english,'en');break
     issues.append((book,ref,speech));continue
    en_ranges.append([indices[i],indices[i+len(target)-1]+1]);pos=i+len(target)
  if not en_ranges:continue
  for lang in data:
   text=texts[lang][ref]
   if not text:continue
   if lang=='en':ranges=en_ranges
   elif lang in phrases and ref in phrases[lang].get(book,{}):
    ranges=[];pos=0
    for phrase in phrases[lang][book][ref]:
     start=text.index(phrase,pos);ranges.append([start,start+len(phrase)]);pos=start+len(phrase)
   elif lang=='ko':
    if ref in ko_overrides[book]:
     ranges=[];pos=0
     for phrase in ko_overrides[book][ref]:
      start=text.index(phrase,pos);ranges.append([start,start+len(phrase)]);pos=start+len(phrase)
    elif r['mode']=='full':
     end=re.search(r' (?:하시니라|하시니|하신대|하시되|하시거늘|하시더라|하셨느니라)(?:\]|$)',text);ranges=[[0,end.start() if end else len(text)]]
    else:
     starts=list(re.finditer(r'(?:가라사대|가로되|이르시되|대답하시되|말씀하시되) ',text));start=starts[-1].end() if starts else 0
     end=re.search(r' (?:하시거늘|하시니라|하시니|하신대|하시매|하시고|하시므로|하신즉|하시더라|하셨느니라|하시기로|하거늘|하더라|부르시니|대답하되|가로되)',text[start:]);stop=start+end.start() if end else len(text)
     ranges=[[start,stop]]
     review.append(f"{book} {ref}: {text[:start]} |{text[start:stop]}| {text[stop:]}")
   else:
    if r['mode']=='full':ranges=[[0,len(text)]]
    else:
     eq=quotes(english,'en');tq=quotes(text,lang)
     override=phrases[lang].get(book,{}).get(ref)
     if override is not None:
      ranges=[];pos=0
      for phrase in override:
       start=text.index(phrase,pos);ranges.append([start,start+len(phrase)]);pos=start+len(phrase)
      if ranges:data[lang][book][ref]=[fingerprint(text),ranges]
      continue
     if book=='john' and ref in ['1:51','6:64','8:41','12:28','12:36'] and ('」' if lang=='ja' else '”') in text and not text.startswith('「' if lang=='ja' else '“'):
      stop=text.index('」' if lang=='ja' else '”')+1;ranges=[[0,stop]];data[lang][book][ref]=[fingerprint(text),ranges];continue
     if book=='john' and (ref in quote_indices or ref=='21:17'):
      ids=quote_indices.get(ref,[0,1,3] if lang=='ja' else [0,2]);ranges=[tq[i] for i in ids];data[lang][book][ref]=[fingerprint(text),ranges];continue
     if book=='acts' and ref in ['9:10','9:15','22:10']:
      ids=[1] if ref=='22:10' else [0];ranges=[tq[i] for i in ids];data[lang][book][ref]=[fingerprint(text),ranges];continue
     if book=='acts' and ref=='9:10' and lang=='ja':ranges=[tq[0]];data[lang][book][ref]=[fingerprint(text),ranges];continue
     marked=[i for i,(a,b) in enumerate(eq) if any(max(0,min(b,y)-max(a,x))>=(b-a)*.45 for x,y in en_ranges)]
     # All dialogue belongs to Jesus even if a translation combines two quotes.
     if eq and len(marked)==len(eq):ranges=tq
     elif len(eq)==len(tq):ranges=[tq[i] for i in marked]
     else:ranges=[];issues.append((book,ref,lang,'quote alignment',len(eq),len(tq),text))
     if not ranges:issues.append((book,ref,lang,'no quotes',text))
   ranges=[x for x in ranges if x[1]>x[0]]
   if ranges:data[lang][book][ref]=[fingerprint(text),ranges]
if issues:raise ValueError(json.dumps(issues,ensure_ascii=False,indent=2))
(root/'jesus-words-data.js').write_text('// BSB Publishing red-letter metadata v5.16; language-specific ranges audited against unchanged app text.\nexport const jesusWords='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
print('Counts', {l:{b:len(v) for b,v in books.items()} for l,books in data.items()});print('Issues',len(issues));print(json.dumps(issues,ensure_ascii=False,indent=2)[:9500])
