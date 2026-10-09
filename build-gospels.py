"""Preserve each Gospel's KRV text and build its own contextual image plan."""
from pathlib import Path
import json
import sys

root = Path(__file__).resolve().parent
books = {'matthew': ('마태복음', 'Matthew', 'MAT', 28, 1071),
         'mark': ('마가복음', 'Mark', 'MRK', 16, 678),
         'luke': ('누가복음', 'Luke', 'LUK', 24, 1151)}
style = '''Use case: historical-scene. Asset: Vible cinematic visual Bible. Create ONE original high-quality wide 16:9 landscape photograph-like film frame, never a collage. Emotionally absorbing large-format historical cinema: monumental real-world spatial depth with tactile limestone, coarse linen, olive timber, believable skin and ordinary water; alternate story-motivated immense landscapes and intimate human recognition. Preserve the established Vible and Take Heart tone: luminous ivory, muted sage, pale blue, terracotta and restrained gold, practical natural light, subtle film grain, readable shadows, no muddy painting, cartoon, videogame poster, glossy fantasy or artificial halos. First-century Galilee, Judea, Samaria and nearby regions appropriate to THIS Gospel passage, plausible small homes and provincial Roman setting, no medieval cathedrals, modern technology or imperial fantasy palaces. LEFT 42% calm low-detail background for scripture; essential faces and actions RIGHT CENTER x=55-88%; lower 18% without essential faces or gestures. Dignified distinct adult faces, emotionally precise eyes and posture rather than generic tears; anatomically coherent hands trace to their own wrists, elbows and shoulders, realistic supported grips, feet, loads, boat hulls and seated bodies. Jesus NEVER has a visible face, head profile or reflection, including infancy and childhood: prefer entirely offscreen, strictly rear view with face fully hidden, or one coherent cream-sleeved forearm at frame edge when this action needs it. A swaddled baby Jesus faces inward with head completely concealed; do not use supplied Sung references as Jesus. God and Holy Spirit never human bodies, faces or disembodied hands. Angels only where the passage calls for them; if winged, one coherent pair rooted in the UPPER BACK behind shoulder blades, separate from arms and chest, with correct perspective and occlusion. Adults only for marriage; children safely fully clothed, infants swaddled and supported. No nudity, sexual imagery, gore, graphic disease, self-harm method, mutilation, abuse or torture; convey difficult passages with objects, aftermath and sober reactions. No demons as biological monsters, ethnic villain caricatures or modern prophecy identifications. Parables, dreams, recollections and future teaching stay selective interpretive imagery, not added historical events. Do not add events, people, props or outcomes from a parallel Gospel if absent here. No readable writing, labels, numerals, logos, watermarks, borders or captions in the image.'''
references = {'sung': 'references/gospels/sung-authorized.png',
              'woman': 'references/gospels/sung-woman-approved.png'}
identity = {
    'sung': 'INPUT IMAGE is a facial-identity reference ONLY for the specified adult recipient, never Jesus or the whole crowd. Preserve Sung Kim\'s supplied East Asian face, eye spacing, nose, tousled medium-length black hair, dark moustache and short beard, natural mature age. Recast clothes and acting as described in PRIMARY SCENE; do not copy modern T-shirt, pose or blue wall. Fictional biblical performance, not a claim about the real person\'s illness, biography or identity. All supporting people have distinct original faces.',
    'woman': 'INPUT IMAGE is the previously user-approved FEMININE Sung character facial anchor, not an edit target or the current Samaritan-well story. Preserve this same adult FEMALE East Asian face, eyes, nose, mouth, softened oval jaw and long black hair, with NO beard or moustache. Keep sage linen shawl and muted terracotta tunic for this specified woman. Create the NEW Gospel action and setting described below; no water well or Samaritan story imported. This is a fictional biblical casting adaptation. All supporting people have distinct original faces.'}

for book in sys.argv[1:] or books:
    name, english, code, chapters, verse_count = books[book]
    source = json.loads((root / f'data/{book}-source.json').read_text())
    overrides_file = root / f'{book}-overrides.json'
    overrides = json.loads(overrides_file.read_text()) if overrides_file.exists() else {}
    scenes = []
    for line in (root / f'{book}-outline.txt').read_text().splitlines():
        if not line.strip():
            continue
        if line.isdigit():
            chapter = int(line)
            continue
        fields = line.split('|')
        bounds, title, kind, visual = fields[:4]
        cast = fields[4] if len(fields) > 4 else None
        first, last = map(int, bounds.split('-'))
        verses = [v for v in source['chapters'][chapter-1]['verses'] if first <= v['verse'] <= last]
        assert len(verses) == last-first+1, (book, chapter, first, last)
        number = len(scenes)+1
        prompt = style + f'\nPassage: {english} {chapter}:{first}–{last}. Kind: {kind}.\nPRIMARY SCENE: ' + visual
        scene = dict(id=number, chapter=chapter, first=first, last=last, title=title, kind=kind,
                     visual=visual, verses=verses, image=overrides.get(str(number), f'{book}-{number:03}-right-v1.jpg'),
                     source=f'https://www.bible.com/ko/bible/88/{code}.{chapter}.KRV', prompt=prompt)
        if cast:
            scene['cast'] = cast
            scene['referenceImages'] = [references[cast]]
            scene['prompt'] += '\nCAST REFERENCE: ' + identity[cast]
        scenes.append(scene)
    assert len(source['chapters']) == chapters
    assert sum(len(c['verses']) for c in source['chapters']) == verse_count
    for c in source['chapters']:
        assert [v for s in scenes if s['chapter'] == c['chapter'] for v in s['verses']] == c['verses'], (book, c['chapter'])
    data = dict(book=name, translation='개역한글', attribution='성경전서 개역한글판 © 대한성서공회 1961.',
                source='https://github.com/yuhwan/Bible-krv', verification=f'https://www.bible.com/ko/bible/88/{code}.1.KRV',
                copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',
                chapters=chapters, verseCount=verse_count, sceneCount=len(scenes), scenes=scenes)
    (root / f'data/{book}.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n')
    plan = dict(method='built-in image_gen; maximum 10 concurrent calls', images=[
        {k: s[k] for k in ['id','chapter','first','last','title','kind','image','prompt','cast','referenceImages'] if k in s} for s in scenes])
    (root / f'{book}-image-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=2)+'\n')
    print(f'{book}: {len(scenes)} contexts; {chapters} chapters and {verse_count} unchanged verses, no gaps or overlaps.')
