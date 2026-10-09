"""Build Romans from preserved KRV verses and an explicit context outline."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent
source = json.loads((root / 'data/romans-source.json').read_text())
style = '''Use case: historical-scene. Asset: Vible visual Bible, ONE new cinematic 16:9 landscape frame. Match the existing Samaritan-woman and Vible images: luminous natural-light large-format photoreal historical cinema, 35mm lens, layered foreground/midground/background, pale Mediterranean blue, limestone ivory, muted sage, terracotta, undyed linen, weathered olive wood. First-century Roman Mediterranean setting unless the scene explicitly recalls an earlier biblical period. Daylight is bright and readable, never dark sepia painting; dusk or night remain authentic with visible practical lamplight. Reserve the LEFT 42 percent as quiet low-detail natural wall, ground, sky or distant landscape, with NO main people, important objects or action. Place ALL storytelling people, props and action in RIGHT CENTER x=55–88 percent, fully inside the frame. Keep lower 18 percent free of essential faces or gestures for mobile scripture. Original varied historically plausible Jewish, Mediterranean and African women and men, faces only when useful; dignified expressions and natural unglamorous skin. Paul: lean middle-aged Jewish man with receding dark curls, short beard, cream linen and muted indigo mantle. Jesus only rear/distant or outside frame; never depict his face. Never portray God or Holy Spirit as a human, angel or glowing body. Show this passage's meaning through its SPECIFIC concrete scene, not a generic repeated preacher, valley or ornamental crowd. This book is a letter: editorial scenes and teaching metaphors are NOT claimed recorded events. No invented miracles, prosperity guarantees, anti-Jewish caricature, modern objects, readable lettering, captions, logos, watermarks, halos or magic glow. One coherent shot, no collage or split screen. Physically correct attached limbs, two natural hands per person, coherent grips and containers, supported feet and seated bodies, realistic scale, gravity and perspective; no intersecting architecture or floating props. A compelling understandable scene with the same film tone as Vible, no text in image.'''
scenes = []
overrides_path = root / 'romans-overrides.json'
overrides = json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
for line in (root / 'romans-outline.txt').read_text().splitlines():
    if not line.strip():
        continue
    if line.isdigit():
        chapter = int(line)
        continue
    bounds, title, kind, visual = line.split('|')
    first, last = map(int, bounds.split('-'))
    verses = [v for v in source['chapters'][chapter - 1]['verses'] if first <= v['verse'] <= last]
    assert len(verses) == last - first + 1, (chapter, first, last)
    number = len(scenes) + 1
    scenes.append(dict(id=number, chapter=chapter, first=first, last=last, title=title,
                       kind=kind, visual=visual, verses=verses, image=overrides.get(str(number), f'romans-{number:03}-right-v1.jpg'),
                       source=f'https://www.bible.com/ko/bible/88/ROM.{chapter}.KRV',
                       prompt=style + f'\nPassage: Romans {chapter}:{first}–{last}.\nPRIMARY SCENE: ' + visual))
for chapter in source['chapters']:
    assert [v for s in scenes if s['chapter'] == chapter['chapter'] for v in s['verses']] == chapter['verses']
assert len(source['chapters']) == 16
assert sum(len(c['verses']) for c in source['chapters']) == 433
data = dict(book='로마서', translation='개역한글', attribution='성경전서 개역한글판 © 대한성서공회 1961.',
            source='https://github.com/yuhwan/Bible-krv', verification='https://www.bible.com/ko/bible/88/ROM.1.KRV',
            copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',
            chapters=16, verseCount=433, sceneCount=len(scenes), scenes=scenes)
(root / 'data/romans.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
(root / 'romans-image-plan.json').write_text(json.dumps(dict(method='built-in image_gen; maximum 10 concurrent calls',
    images=[{k: s[k] for k in ['id', 'chapter', 'first', 'last', 'title', 'kind', 'image', 'prompt']} for s in scenes]),
    ensure_ascii=False, indent=2) + '\n')
print(f'{len(scenes)} contexts; 16 chapters and 433 unchanged verses, no gaps or overlaps.')
