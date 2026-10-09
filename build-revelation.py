"""Build Revelation from preserved KRV verses and an explicit context outline."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent
source = json.loads((root / 'data/revelation-source.json').read_text())
style = '''Use case: cinematic visual Bible. ONE original 16:9 landscape frame, photographic large-format historical cinema, 35mm lens, dimensional foreground/midground/background, physically convincing stone, linen, wood, water and skin. Match Vible's luminous Mediterranean palette: ivory limestone, muted sage, pale blue, terracotta and restrained gold; high dynamic range, never muddy sepia painting, cartoon or video-game poster. Historical/editorial scenes are first-century Aegean communities; visionary scenes may freely transcend ordinary reality with sublime scale, crystal expanses, meaningful light and surreal biblical symbols, still filmed as a coherent believable shot. Let THIS passage's specific image and emotional movement drive the frame, vary subjects and settings rather than repeatedly drawing a teacher or generic landscape. LEFT 42 percent quiet low-detail space for scripture, all essential people, symbols and actions RIGHT CENTER x=55–88 percent; keep lower 18 percent free of essential faces/gestures. John: weathered older Jewish man, grey curls and short beard, cream linen, faded ochre mantle; include only if scene calls for him. Diverse dignified Mediterranean and African people, anatomically coherent hands and feet, realistic grips, containers, gravity and material scale except intentional visionary scale. This is a symbolic revelation, not a forecast photograph or exhaustive blueprint. Do not identify disputed symbols with present-day people, countries, organizations, technologies or a fixed end-time chronology. Do not replace textual imagery with arbitrary new doctrine. Jesus human form only rear/distant/face concealed, never show his face. God and Holy Spirit never human bodies or faces; divine presence may be off-frame/veiled radiance, not a visibly vacant abandoned throne. Angels may be clothed visionary messengers. Lamb imagery is allowed and should be gentle, living, dignified, distinct from counterfeit beasts. No gore, torture spectacle, sexualized women, hostile ethnic caricatures, numerical tattoos, readable text, names, diagrams, captions, logos or watermarks. Spiritual conflict is not demonization of an ethnic group. No added modern objects, modern churches, spacecraft or weapons. Restrained luminous vision, awe, fidelity, judgment, mercy and hope as required by the scene. One coherent frame, no collage. No text in image.'''
scenes = []
overrides_path = root / 'revelation-overrides.json'
overrides = json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
for line in (root / 'revelation-outline.txt').read_text().splitlines():
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
                       kind=kind, visual=visual, verses=verses, image=overrides.get(str(number), f'revelation-{number:03}-right-v1.jpg'),
                       source=f'https://www.bible.com/ko/bible/88/REV.{chapter}.KRV',
                       prompt=style + f'\nPassage: Revelation {chapter}:{first}–{last}.\nPRIMARY SCENE: ' + visual))
for chapter in source['chapters']:
    assert [v for s in scenes if s['chapter'] == chapter['chapter'] for v in s['verses']] == chapter['verses']
assert len(source['chapters']) == 22
assert sum(len(c['verses']) for c in source['chapters']) == 404
data = dict(book='요한계시록', translation='개역한글', attribution='성경전서 개역한글판 © 대한성서공회 1961.',
            source='https://github.com/yuhwan/Bible-krv', verification='https://www.bible.com/ko/bible/88/REV.1.KRV',
            copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',
            chapters=22, verseCount=404, sceneCount=len(scenes), scenes=scenes)
(root / 'data/revelation.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
(root / 'revelation-image-plan.json').write_text(json.dumps(dict(method='built-in image_gen; maximum 10 concurrent calls',
    images=[{k: s[k] for k in ['id', 'chapter', 'first', 'last', 'title', 'kind', 'image', 'prompt']} for s in scenes]),
    ensure_ascii=False, indent=2) + '\n')
print(f'{len(scenes)} contexts; 22 chapters and 404 unchanged verses, no gaps or overlaps.')
