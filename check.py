from pathlib import Path
import json,hashlib,sys
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parent
book=next((x for x in sys.argv[1:] if x in ['john','acts']),'john')
data=json.loads((root/f'data/{book}.json').read_text())
source=json.loads((root/f'data/{book}-source.json').read_text())
scenes=data['scenes']
count=data['sceneCount']
assert len(scenes)==count
assert [s['id'] for s in scenes]==list(range(1,count+1))
for chapter in source['chapters']:
    extracted=[v for s in scenes if s['chapter']==chapter['chapter'] for v in s['verses']]
    assert extracted==chapter['verses'],f"Changed or missing verses: {chapter['chapter']}"
assert sum(len(s['verses']) for s in scenes)==data['verseCount']
hashes=set();missing=[]
for s in scenes:
    file=root/'assets'/s['image']
    if not file.exists():missing.append(s['id']);continue
    with Image.open(file) as im:im.verify()
    with Image.open(file) as im:assert im.width>=1000 and im.height>=500
    digest=hashlib.sha256(file.read_bytes()).hexdigest();assert digest not in hashes
    hashes.add(digest)
print(json.dumps(dict(book=book,chapters=data['chapters'],verses=data['verseCount'],scenes=count,unchanged_source=True,unique_images=len(hashes),missing=missing)))
review=root/'review'/book;review.mkdir(exist_ok=True,parents=True)
def sheet(items,cols,w,h,out):
    canvas=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#f4f1e9');draw=ImageDraw.Draw(canvas)
    for i,s in enumerate(items):
        x,y=i%cols*w,i//cols*h;file=root/'assets'/s['image']
        if file.exists():
            with Image.open(file) as im:canvas.paste(ImageOps.fit(im.convert('RGB'),(w-8,h-28)),(x+4,y+4))
        draw.text((x+8,y+h-20),f"{s['id']:03}  {book.title()} {s['chapter']}:{s['first']}-{s['last']}",fill='#283c34')
    canvas.save(out,quality=92)
for start in range(0,count,20):sheet(scenes[start:start+20],5,400,248,review/f'{start+1:03}-{min(start+20,count):03}.jpg')
sheet(scenes,10,250,164,review/'overview.jpg')

if missing and "--partial" not in sys.argv:
    raise SystemExit("Missing images: "+str(missing))
