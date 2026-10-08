from pathlib import Path
import json,hashlib,sys
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parent
data=json.loads((root/'data/john.json').read_text())
source=json.loads((root/'data/john-source.json').read_text())
scenes=data['scenes']
assert len(scenes)==data['sceneCount']==196
assert [s['id'] for s in scenes]==list(range(1,197))
for chapter in source['chapters']:
    extracted=[v for s in scenes if s['chapter']==chapter['chapter'] for v in s['verses']]
    assert extracted==chapter['verses'],f"Changed or missing verses: {chapter['chapter']}"
assert sum(len(s['verses']) for s in scenes)==879
hashes=set();missing=[]
for s in scenes:
    file=root/'assets'/s['image']
    if not file.exists():missing.append(s['id']);continue
    with Image.open(file) as im:im.verify()
    with Image.open(file) as im:assert im.width>=1000 and im.height>=500
    digest=hashlib.sha256(file.read_bytes()).hexdigest();assert digest not in hashes
    hashes.add(digest)
print(json.dumps(dict(chapters=21,verses=879,scenes=196,unchanged_source=True,unique_images=len(hashes),missing=missing)))
review=root/'review';review.mkdir(exist_ok=True)
def sheet(items,cols,w,h,out):
    canvas=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*h),'#f4f1e9');draw=ImageDraw.Draw(canvas)
    for i,s in enumerate(items):
        x,y=i%cols*w,i//cols*h;file=root/'assets'/s['image']
        if file.exists():
            with Image.open(file) as im:canvas.paste(ImageOps.fit(im.convert('RGB'),(w-8,h-28)),(x+4,y+4))
        draw.text((x+8,y+h-20),f"{s['id']:03}  John {s['chapter']}:{s['first']}-{s['last']}",fill='#283c34')
    canvas.save(out,quality=92)
for start in range(0,196,20):sheet(scenes[start:start+20],5,400,248,review/f'{start+1:03}-{min(start+20,196):03}.jpg')
sheet(scenes,10,250,164,root/'john-196-overview.jpg')

if missing and "--partial" not in sys.argv:
    raise SystemExit("Missing images: "+str(missing))
