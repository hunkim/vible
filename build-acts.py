"""Compile every Acts verse into consecutive editorial context scenes."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent
source=json.loads((root/'data/acts-source.json').read_text())
style='''Use case: historical-scene. Asset: Vible cinematic Bible background, single 16:9 landscape frame. Photorealistic large-format IMAX historical epic with the luminous, intimate Samaritan-woman film tone: natural sun, pale Mediterranean blue, limestone ivory, muted sage, terracotta, tactile linen and weathered olive wood; spacious depth, atmospheric realism, 35mm lens. First-century Roman Mediterranean architecture and geography specific to the passage. Historical recollections use their earlier period instead. Daytime bright and readable, never sepia gloom; night remains night with credible moonlight and oil lamps and visible details. Main action in center-right half, leave left third calmer for HTML scripture overlay; lower edge also visually calm for mobile. Emotion through gestures and scale, show faces only where needed, original varied West Asian, African and Mediterranean women and men appropriate to story, never cloned faces. Character continuity: Peter sturdy middle-aged Jewish man, dark wavy hair graying at temples, short salt-and-pepper beard, cream linen and ochre mantle; Saul/Paul lean Jewish man with receding dark curls, short dark beard, undyed tunic and muted indigo outer mantle, gradually older later; Barnabas broad shoulders, chestnut beard and russet mantle. Jesus only rear/distant view in undyed tunic and sand mantle. No face or body of God or Holy Spirit. Miracles show exactly the passage, no added fantasy beings, halos or magic glow; scripture visions and quoted history are illustrations of those accounts, not events happening to the present audience. Humane dignity, no gore, no modern objects, no text, captions, symbols, lettering, logos or watermark. One coherent shot, no collage.'''
scenes=[]
for line in (root/'acts-outline.txt').read_text().splitlines():
 if not line.strip():continue
 if line.isdigit():chapter=int(line);continue
 bounds,title,visual=line.split('|')
 first,last=map(int,bounds.split('-')) if '-' in bounds else (int(bounds),int(bounds))
 verses=[v for v in source['chapters'][chapter-1]['verses'] if first<=v['verse']<=last]
 assert len(verses)==last-first+1,(chapter,first,last)
 n=len(scenes)+1
 kind='recollection' if visual.startswith(('Historical recollection','Recollection:')) else 'vision' if visual.startswith('Vision') else 'metaphor' if visual.startswith('Teaching illustration') else 'narrative'
 scenes.append(dict(id=n,chapter=chapter,first=first,last=last,title=title,kind=kind,visual=visual,verses=verses,image=f'acts-{n:03}.jpg',source=f'https://www.bible.com/ko/bible/88/ACT.{chapter}.KRV',prompt=style+f'\nPassage: Acts {chapter}:{first}–{last}.\nScene: '+visual))
extras=json.loads((root/'acts-extra-scenes.json').read_text())
expanded=[];extra_index=0
for scene in scenes:
 parts=extras.get(f"{scene['chapter']}:{scene['first']}-{scene['last']}")
 if not parts:
  if scene['chapter']==9 and scene['first']==10:scene['kind']='vision'
  expanded.append(scene);continue
 for first,last,title,visual,*reuse in parts:
  item=scene.copy();item.update(first=first,last=last,title=title)
  item['verses']=[v for v in scene['verses'] if first<=v['verse']<=last]
  if visual:
   extra_index+=1;item.update(visual=visual,image=f'acts-context-{extra_index:03}.jpg')
   item['kind']='vision' if visual.startswith('Vision') else 'narrative'
  item['prompt']=style+f"\nPassage: Acts {item['chapter']}:{first}–{last}.\nScene: "+item['visual']
  expanded.append(item)
scenes=expanded
override_file=root/'acts-overrides.json'
overrides=json.loads(override_file.read_text()) if override_file.exists() else {}
for scene in scenes:
 if scene['image'] in overrides:scene.update(overrides[scene['image']])
for i,scene in enumerate(scenes):scene['id']=i+1
for c in source['chapters']:
 assert [v for s in scenes if s['chapter']==c['chapter'] for v in s['verses']]==c['verses'],c['chapter']
data=dict(book='사도행전',translation='개역한글',attribution='성경전서 개역한글판 © 대한성서공회 1961.',source='https://github.com/yuhwan/Bible-krv',verification='https://www.bible.com/ko/bible/88/ACT.1.KRV',copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',chapters=28,verseCount=1007,sceneCount=len(scenes),scenes=scenes)
(root/'data/acts.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(root/'acts-image-plan.json').write_text(json.dumps(dict(method='built-in image_gen; maximum 10 concurrent calls',images=[{k:s[k] for k in ['id','chapter','first','last','title','kind','image','prompt']} for s in scenes]),ensure_ascii=False,indent=2))
print(f'{len(scenes)} scenes; 28 chapters and 1007 unchanged verses, no gaps or overlaps')
