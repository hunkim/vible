"""Import eBible VPL wording verbatim, preserving USFM verse bridges.
Usage: python3 import-open-translations.py /path/to/downloaded-archives
"""
from pathlib import Path
import json,zipfile,re,sys,hashlib
root=Path(__file__).resolve().parent; downloads=Path(sys.argv[1])
books={'john':'JOH','acts':'ACT','romans':'ROM','revelation':'REV'}
names={'en':['John','Acts','Romans','Revelation'],'ja':['ヨハネによる福音書','使徒の働き','ローマ人への手紙','ヨハネの黙示録'],'zh':['约翰福音','使徒行传','罗马书','启示录']}
configs=[('en','engbsb','Berean Standard Bible','Berean Standard Bible · BSB Publishing, LLC · Public Domain'),('ja','jpn1965','新改訳新約聖書（1965年版）','新改訳新約聖書（1965年版） · Shinkaiyaku Seisho Kankokai · Public Domain'),('zh','cmncbs','Biblica® 圣经当代译本™开放资源（2022）','Biblica® 圣经当代译本™开放资源 · © 1979, 2005, 2007, 2011, 2022 Biblica, Inc. · Biblica® Open Chinese Contemporary Bible™ (Simplified Script). Biblica is a trademark registered by Biblica, Inc. Used with permission. · CC BY-SA 4.0')]
for lang,code,edition,notice in configs:
 raw=(downloads/f'{code}.zip').read_bytes();z=zipfile.ZipFile(downloads/f'{code}.zip');text=z.read(f'{code}_vpl.txt').decode('utf-8-sig');verses={}
 for line in text.splitlines():
  m=re.match(r'^(JOH|ACT|ROM|REV) (\d+):(\d+) (.*)$',line)
  if m:verses[(m[1],int(m[2]),int(m[3]))]=m[4]
 bridges={};u=zipfile.ZipFile(downloads/f'{code}_usfm.zip')
 for file in u.namelist():
  if not file.endswith('.usfm'):continue
  usfm=u.read(file).decode('utf-8-sig');ident=re.search(r'\\id (\S+)',usfm)
  if not ident or ident[1] not in ['JHN','ACT','ROM','REV']:continue
  book='JOH' if ident[1]=='JHN' else ident[1];chapter=0
  for m in re.finditer(r'\\c (\d+)|\\v (\d+)-(\d+)',usfm):
   if m[1]:chapter=int(m[1])
   else:bridges[(book,chapter,int(m[2]))]=int(m[3])
 folder=root/f'data/translations/{lang}';folder.mkdir(parents=True,exist_ok=True)
 for i,(book,key) in enumerate(books.items()):
  base=json.loads((root/f'data/{book}.json').read_text());chapters=[]
  for c in range(1,base['chapters']+1):
   output=[];positions=[v['verse'] for s in base['scenes'] if s['chapter']==c for v in s['verses']]
   for v in positions:
    wording=verses.get((key,c,v));first=next((start for (b,ch,start),end in bridges.items() if b==key and ch==c and start<v<=end),None)
    if first is not None:output.append({'verse':v,'text':'','omitted':True,'combinedWith':first});continue
    if wording is None:
     assert lang=='en' and (key,c,v) in [('JOH',5,4),('ACT',8,37),('ACT',15,34),('ACT',24,7),('ACT',28,29),('ROM',16,24)],(code,key,c,v)
     output.append({'verse':v,'text':'','omitted':True});continue
    item={'verse':v,'text':wording}
    if (key,c,v) in bridges:item['endVerse']=bridges[(key,c,v)]
    output.append(item)
   chapters.append({'chapter':c,'verses':output})
  doc={'language':lang,'book':names[lang][i],'translation':edition,'attribution':notice,'source':f'https://ebible.org/{code}/','licenseSource':f'https://ebible.org/{code}/copyright.htm','license':'CC BY-SA 4.0' if lang=='zh' else 'Public Domain','permissions':{'display':True,'shareCards':True},'downloadSource':f'https://ebible.org/Scriptures/{code}_vpl.zip','downloadSHA256':hashlib.sha256(raw).hexdigest(),'retrieved':'2026-10-09','chapters':chapters}
  (folder/f'{book}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n');print(lang,book,len([v for c in chapters for v in c['verses'] if not v.get('omitted')]))
