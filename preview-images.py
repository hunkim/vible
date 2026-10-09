from pathlib import Path
import json,sys
from PIL import Image,ImageOps,ImageDraw
root=Path(__file__).resolve().parent
context='--context' in sys.argv;ids=[int(n) for n in sys.argv[1:] if n!='--context'];prefix='acts-context-' if context else 'acts-'
data=json.loads((root/'data/acts.json').read_text())
scenes=[next(s for s in data['scenes'] if s['image']==f'{prefix}{n:03}.jpg') for n in ids if (root/'assets'/f'{prefix}{n:03}.jpg').exists()]
out=root/'review'/'batches';out.mkdir(parents=True,exist_ok=True)
w,h=320,210;canvas=Image.new('RGB',(w*5,h*2),'#f4f1e9');d=ImageDraw.Draw(canvas)
for i,s in enumerate(scenes[:10]):
 x,y=i%5*w,i//5*h
 with Image.open(root/'assets'/s['image']) as im:canvas.paste(ImageOps.fit(im.convert('RGB'),(w-8,180)),(x+4,y+4))
 d.text((x+8,y+190),f"{s['id']:03} Acts {s['chapter']}:{s['first']}-{s['last']}",fill='#283c34')
file=out/f"{prefix}{ids[0]:03}-{ids[-1]:03}.jpg";canvas.save(file,quality=90);print(file)
