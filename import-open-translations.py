"""Import eBible VPL wording verbatim, preserving USFM verse bridges.
Usage: python3 import-open-translations.py /path/to/downloaded-archives
"""
from pathlib import Path
import json,zipfile,re,sys,hashlib,subprocess
from html import unescape
root=Path(__file__).resolve().parent; downloads=Path(sys.argv[1])
books={'john':'JOH','acts':'ACT','romans':'ROM','revelation':'REV','genesis':'GEN','matthew':'MAT','mark':'MAR','luke':'LUK'}
for catalog in ['epistles-books.json','pentateuch-books.json','psalms-books.json']:
 for book in json.loads((root/catalog).read_text()):books[book['id']]={'PHP':'PHI','JAS':'JAM','1JN':'1JO','2JN':'2JO','3JN':'3JO'}.get(book['code'],book['code'])
names=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {bookNames} from './languages.js';console.log(JSON.stringify(bookNames))"],cwd=root,text=True))
ot={'genesis':'01_gen','exodus':'02_exod','leviticus':'03_lev','numbers':'04_num','deuteronomy':'05_deut','psalms':'19_ps'}
usfm_codes={'JHN':'JOH','MRK':'MAR','PHP':'PHI','JAS':'JAM','1JN':'1JO','2JN':'2JO','3JN':'3JO','JUD':'JUD'}
omissions={('MAT',17,21),('MAT',18,11),('MAT',23,14),('MAR',7,16),('MAR',9,44),('MAR',9,46),('MAR',11,26),('MAR',15,28),('LUK',17,36),('LUK',23,17),('JOH',5,4),('ACT',8,37),('ACT',15,34),('ACT',24,7),('ACT',28,29),('ROM',16,24)}
configs=[('en','engbsb','Berean Standard Bible','Berean Standard Bible · BSB Publishing, LLC · Public Domain'),('ja','jpn1965','新改訳新約聖書（1965年版）','新改訳新約聖書（1965年版） · Shinkaiyaku Seisho Kankokai · Public Domain'),('zh','cmncbs','Biblica® 圣经当代译本™开放资源（2022）','Biblica® 圣经当代译本™开放资源 · © 1979, 2005, 2007, 2011, 2022 Biblica, Inc. · Biblica® Open Chinese Contemporary Bible™ (Simplified Script). Biblica is a trademark registered by Biblica, Inc. Used with permission. · CC BY-SA 4.0')]
for lang,code,edition,notice in configs:
 raw=(downloads/f'{code}.zip').read_bytes();z=zipfile.ZipFile(downloads/f'{code}.zip');text=z.read(f'{code}_vpl.txt').decode('utf-8-sig');verses={}
 for line in text.splitlines():
  m=re.match(r'^(\w+) (\d+):(\d+) (.*)$',line)
  if m:verses[(m[1],int(m[2]),int(m[3]))]=m[4]
 bridges={};u=zipfile.ZipFile(downloads/f'{code}_usfm.zip')
 for file in u.namelist():
  if not file.endswith('.usfm'):continue
  usfm=u.read(file).decode('utf-8-sig');ident=re.search(r'\\id (\S+)',usfm)
  if not ident:continue
  book=usfm_codes.get(ident[1],ident[1]);chapter=0
  for m in re.finditer(r'\\c (\d+)|\\v (\d+)-(\d+)',usfm):
   if m[1]:chapter=int(m[1])
   else:bridges[(book,chapter,int(m[2]))]=int(m[3])
 # BSB places the Greek closing greetings in verse 14; its USFM footnote explains the alternative verse 15 numbering.
 if lang=='en':bridges[('3JO',1,14)]=15
 folder=root/f'data/translations/{lang}';folder.mkdir(parents=True,exist_ok=True)
 for book,key in books.items():
  if lang=='ja' and book in ot:continue
  base=json.loads((root/f'data/{book}.json').read_text());chapters=[]
  for c in range(1,base['chapters']+1):
   output=[];positions=[v['verse'] for s in base['scenes'] if s['chapter']==c for v in s['verses']]
   for v in positions:
    wording=verses.get((key,c,v));first=next((start for (b,ch,start),end in bridges.items() if b==key and ch==c and start<v<=end),None)
    if first is not None:output.append({'verse':v,'text':'','omitted':True,'combinedWith':first});continue
    if wording is None:
     assert lang=='en' and (key,c,v) in omissions,(code,key,c,v)
     output.append({'verse':v,'text':'','omitted':True});continue
    item={'verse':v,'text':wording}
    if (key,c,v) in bridges:item['endVerse']=bridges[(key,c,v)]
    output.append(item)
   chapters.append({'chapter':c,'verses':output})
  doc={'language':lang,'book':names[lang][book],'translation':edition,'attribution':notice,'source':f'https://ebible.org/{code}/','licenseSource':f'https://ebible.org/{code}/copyright.htm','license':'CC BY-SA 4.0' if lang=='zh' else 'Public Domain','permissions':{'display':True,'shareCards':True},'downloadSource':f'https://ebible.org/Scriptures/{code}_vpl.zip','downloadSHA256':hashlib.sha256(raw).hexdigest(),'retrieved':'2026-10-09','chapters':chapters}
  (folder/f'{book}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');print(lang,book,len([v for c in chapters for v in c['verses'] if not v.get('omitted')]))

# Public-domain 1955 Japanese Old Testament; omit ruby pronunciation markup only.
for book,slug in ot.items():
 raw=(downloads/f'{book}.html').read_bytes();html=raw.decode('utf-8-sig');parts=re.split(r'<h3[^>]*>.*?</h3>',html,flags=re.S)[1:];base=json.loads((root/f'data/{book}.json').read_text());assert len(parts)==base['chapters'],(book,len(parts));chapters=[]
 for c,part in enumerate(parts,1):
  entries=re.split(r'<em>([^<]+)</em>',part);verses={};segments={};combined={}
  for i in range(1,len(entries),2):
   content=re.sub(r'<(?:rt|rp)>.*?</(?:rt|rp)>','',entries[i+1],flags=re.S);content=re.sub(r'<[^>]+>','',content);content=unescape(content).strip();content=re.sub(r'\s+','',content);label=entries[i];number=int(re.match(r'\d+',label)[0]);segments.setdefault(number,[]).append((label,content))
   matches=re.findall(r'(\d+):(\d+)',label)
   if matches:
    assert all(int(ch)==c for ch,v in matches);combined[number]=max(int(v) for ch,v in matches)
  verses={n:''.join(t for label,t in sorted(parts)) for n,parts in segments.items()}
  positions=[v['verse'] for s in base['scenes'] if s['chapter']==c for v in s['verses']];output=[]
  for v in positions:
   first=next((start for start,end in combined.items() if start<v<=end),None)
   if first is not None:output.append({'verse':v,'text':'','omitted':True,'combinedWith':first});continue
   assert v in verses and verses[v],(book,c,v,verses.keys());item={'verse':v,'text':verses[v]}
   if v in combined:item['endVerse']=combined[v]
   output.append(item)
  chapters.append({'chapter':c,'verses':output})
 doc={'language':'ja','book':names['ja'][book],'translation':'口語訳聖書（1955年版）','attribution':'口語訳聖書（1955年版） · 日本聖書協会 · Public Domain','source':f'https://www.ogccl.org/jcb/jcb_ot_{slug}.htm','licenseSource':'https://www.bible.or.jp/read/bible_copyright.html','license':'Public Domain','permissions':{'display':True,'shareCards':True},'downloadSource':f'https://www.ogccl.org/jcb/jcb_ot_{slug}.htm','downloadSHA256':hashlib.sha256(raw).hexdigest(),'retrieved':'2026-10-10','chapters':chapters}
 (root/f'data/translations/ja/{book}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');print('ja',book,sum(len(c['verses']) for c in chapters))
