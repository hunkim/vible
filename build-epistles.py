"""Build the remaining NT letters without changing KRV wording or verse boundaries."""
from pathlib import Path
import ast
import json
import sys

root = Path(__file__).resolve().parent
books = {b['id']: b for b in json.loads((root/'epistles-books.json').read_text())}
# Reuse the established cinematic composition and anatomy rules, with letter-specific geography.
tree = ast.parse((root/'build-gospels.py').read_text())
style = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'style' for t in n.targets))
style = style.replace('First-century Galilee, Judea, Samaria and nearby regions appropriate to THIS Gospel passage, plausible small homes and provincial Roman setting', 'First-century eastern Roman Mediterranean appropriate to this letter, plausible small homes, port cities and provincial Roman setting; earlier recollections use their own biblical era')
style += ''' These books are LETTERS: editorial reconstructions and concrete teaching metaphors are not claimed recorded events. Match the specific argument, relationship and emotional transition, not generic repeated preachers. Paul, when specified: original lean middle-aged Jewish man, receding dark curls, short beard, cream linen and muted indigo mantle; never use a supplied face as Paul unless explicitly specified. Peter and John are distinct original actors. Do not invent diagnoses for Paul's thorn, a literal geography of heaven, modern prophecy dates, guaranteed wealth or guaranteed healing. Vast real spatial depth and magnificent natural light should serve the passage, with intimate recognizable faces when care matters. Output a large detailed 16:9 landscape frame, ideally 2048x1152 or larger.'''
refs = {'sung': ['references/gospels/sung-authorized.png'], 'woman': ['references/gospels/sung-woman-approved.png'], 'yeonkyung': ['references/epistles/yeonkyung-authorized.png', 'references/epistles/yeonkyung-smile-original.jpg']}
identities = {
    'sung': "Preserve supplied Sung Kim's adult East Asian face, eye spacing, nose, tousled black hair, moustache and short beard. Identity only; period linen, no T-shirt or blue wall.",
    'woman': 'Preserve the user-approved fictional feminine Sung: adult East Asian oval face, eyes, nose, mouth, long black hair, absolutely no beard. Sage shawl and muted terracotta tunic. Face only; no well or Samaritan story imported.',
    'yeonkyung': 'Preserve Yeonkyung from the original user-supplied photos: authentic adult age, natural facial proportions, recognizable eye-smile and lovely authentic smile when appropriate. No added age, facial heaviness, exaggerated skin, slimming or generic younger actress. Remove sunglasses and all modern clothes/accessories; muted pale-blue linen tunic and ivory shawl, period hair. First image is primary facial authority; second original smiling photo supports her expression. Do not copy modern setting or use the rejected Take Heart first portrait.'}

for book in sys.argv[1:] or books:
    b = books[book]
    outline = root/f'{book}-outline.txt'
    if not outline.exists():
        continue
    source = json.loads((root/f'data/{book}-source.json').read_text())
    assert len(source['chapters']) == b['chapters']
    assert sum(len(c['verses']) for c in source['chapters']) == b['verseCount']
    op = root/f'{book}-overrides.json'
    overrides = json.loads(op.read_text()) if op.exists() else {}
    scenes = []
    for line in outline.read_text().splitlines():
        if not line.strip():
            continue
        if line.isdigit():
            chapter = int(line)
            continue
        fields = line.split('|')
        bounds, title, kind, visual = fields[:4]
        limits = list(map(int, bounds.split('-')))
        first, last = limits[0], limits[-1]
        verses = [v for v in source['chapters'][chapter-1]['verses'] if first <= v['verse'] <= last]
        assert len(verses) == last-first+1, (book, chapter, bounds)
        number = len(scenes)+1
        prompt = style+f'\nPassage: {b["english"]} {chapter}:{first}–{last}. Kind: {kind}.\nPRIMARY SCENE: '+visual
        s = dict(id=number, chapter=chapter, first=first, last=last, title=title, kind=kind, visual=visual, verses=verses, image=overrides.get(str(number), f'{book}-{number:03}-right-v1.jpg'), source=f'https://www.bible.com/ko/bible/88/{b["code"]}.{chapter}.KRV', prompt=prompt)
        if len(fields)>4 and fields[4]:
            cast = fields[4].split(',')
            s['cast'] = cast
            s['referenceImages'] = [r for role in cast for r in refs[role]]
            offset = 1
            for role in cast:
                s['prompt'] += f'\nCAST {role}, input image(s) {offset}–{offset+len(refs[role])-1}: '+identities[role]
                offset += len(refs[role])
            s['prompt'] += '\nAssign each referenced identity ONLY to the named role in the primary scene, never Jesus, God or the crowd. Others have distinct original faces. Fictional biblical performance, no claims about real biographies or health.'
        scenes.append(s)
    for c in source['chapters']:
        assert [v for s in scenes if s['chapter']==c['chapter'] for v in s['verses']] == c['verses'], (book, c['chapter'], 'gap, overlap or changed text')
    data = dict(book=b['name'], translation='개역한글', attribution='성경전서 개역한글판 © 대한성서공회 1961.', source='https://github.com/yuhwan/Bible-krv', verification=f'https://www.bible.com/ko/bible/88/{b["code"]}.1.KRV', copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5', chapters=b['chapters'], verseCount=b['verseCount'], sceneCount=len(scenes), scenes=scenes)
    (root/f'data/{book}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    plan = dict(method='built-in image_gen; maximum 10 concurrent calls', images=[{k:s[k] for k in ['id','chapter','first','last','title','kind','image','prompt','cast','referenceImages'] if k in s} for s in scenes])
    (root/f'{book}-image-plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
    print(f'{book}: {len(scenes)} distinct contexts; {b["chapters"]} chapters, {b["verseCount"]} unchanged source verses.')
