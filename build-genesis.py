"""Build Genesis from preserved KRV verses and an explicit context outline."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent
source = json.loads((root / 'data/genesis-source.json').read_text())
style = '''Use case: historical-scene. Asset: Vible cinematic visual Bible. ONE original 16:9 landscape frame. An emotionally absorbing monumental Genesis film, photographed with large-format cinema cameras and a 35mm lens, dimensional foreground/midground/background, tactile linen, worn stone, timber, clear water and convincing human skin. Keep established Vible luminous Mediterranean palette: ivory limestone, muted sage, pale blue, terracotta, restrained gold; clean high dynamic range, no muddy sepia painting, cartoon, game poster or glossy AI fantasy. Epic scale serves this specific passage: alternate sublime landscapes and close human vulnerability, never generic preaching. Natural dawn, golden hour, blue night and restrained lamp light appropriate to the story; strong atmosphere but shadows retain detail. Early Genesis imagery is a selective literary visualization, not a scientific timeline or archaeological proof. Patriarchal scenes evoke ancient Near Eastern pastoral households in Canaan and Mesopotamia; Joseph's later scenes restrained ancient Egyptian linen, mudbrick granaries, columns and Nile agriculture, no Roman armor, medieval castles, modern machines or later churches. LEFT 42 percent quiet low-detail space for scripture; essential faces, actions and symbols RIGHT CENTER x=55-88 percent; keep lower 18 percent free of essential faces and gestures. All people dignified, distinct faces with plausible aging, realistic hands, connected arms and legs, supported feet and loads, coherent grips, actual container openings and gravitational water flow. Adults only for romance; infants swaddled and safely supported; no visible nudity, sex, assault, childbirth anatomy, circumcision procedures, cut flesh, gore, torture or body desecration. Depict difficult passages through aftermath, objects and reactions without erasing their seriousness or approving coercion. God and Holy Spirit NEVER human bodies, faces or disembodied hands; divine presence off-frame or nonfigurative meaningful light, no visible deity. Mysterious messengers only when passage calls for them; do not settle disputed identities or ethnic curses, never demonize a people by skin color. No modern flags, fixed scientific explanations or later events presented as already accomplished. Dreams and poetic metaphors visually distinct from actual surroundings but one coherent cinematic frame, no collage. No readable text, labels, numerals, logos, watermarks or captions in image.'''
cast_profiles = {
 'Adam': 'Adam: adult ancient Near Eastern man, warm olive skin, dark curls and short beard; before Genesis 3 body concealed by natural foliage, after 3 opaque simple hides',
 'Eve': 'Eve: adult ancient Near Eastern woman, warm olive skin, long dark wavy hair; before Genesis 3 body concealed by natural foliage, after 3 opaque simple hides',
 'Noah': 'Noah: weathered olive-skinned elderly man, broad face, long grey beard, cream tunic and muted moss-brown mantle',
 'Abram': 'Abram: elderly olive-skinned man, angular kindly face, grey beard, ivory tunic and muted ochre mantle',
 'Abraham': 'Abraham: same angular kindly olive-skinned face as Abram, increasingly white long beard, ivory tunic and muted ochre mantle, always truly elderly',
 'Sarai': 'Sarai: dignified elderly olive-skinned woman, strong brow, grey hair under dusty sage veil and ivory dress',
 'Sarah': 'Sarah: same strong brow as Sarai, clearly elderly with silver hair under dusty sage veil and ivory dress',
 'Hagar': 'Hagar: adult Egyptian woman, warm brown skin, deep expressive eyes, dark hair under muted indigo headcloth, sand-colored dress',
 'Isaac': 'Isaac: gentle olive-skinned man, dark curls and beard becoming grey with age, ivory tunic and muted blue mantle; adolescent on Moriah, mature by marriage, white-bearded elder in 27',
 'Rebekah': 'Rebekah: adult olive-skinned woman, dark almond eyes, dark wavy hair, muted terracotta veil and cream dress, visibly ages with story',
 'Jacob': 'Jacob: olive-skinned man, contemplative face, dark wavy hair and short beard, cream tunic and muted sage mantle; mature in Haran, grey on return, long white beard as old father in Joseph story',
 'Esau': 'Esau: rugged olive-skinned man, reddish-brown curly hair and fuller beard, russet mantle and earth-toned tunic, visibly ages alongside Jacob',
 'Rachel': 'Rachel: adult olive-skinned woman, dark expressive eyes, dark waves under dusty blue veil, ivory dress',
 'Leah': 'Leah: dignified adult olive-skinned woman, thoughtful eyes and broad brow, dark hair under dusty ochre veil, ivory dress, never caricatured as unattractive',
 'Laban': 'Laban: mature olive-skinned man becoming elderly, broad face, greying full beard, brown mantle and sand-colored tunic',
 'Joseph': 'Joseph: distinctive warm olive-skinned narrow face, dark expressive eyes and dark curls; 17 and beardless in 37, young adult in prison, clean-shaven mature administrator from 41 onward; simple linen until promotion, fine ivory linen and restrained gold collar only after 41:37; never the patterned coat in Egypt',
 'Benjamin': 'Benjamin: adult younger brother in Egypt scenes, warm olive skin, dark curls and short beard, simple dusty blue mantle, never a small child in 42-45',
 'Judah': 'Judah: adult olive-skinned broad-faced elder brother, dark hair and sturdy beard becoming grey, terracotta-brown mantle over sand tunic',
 'Tamar': 'Tamar: fully clothed adult olive-skinned woman, dignified thoughtful face, dark hair under opaque charcoal veil, simple widow garments',
}
scenes = []
overrides_path = root / 'genesis-overrides.json'
overrides = json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
for line in (root / 'genesis-outline.txt').read_text().splitlines():
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
    cast = '\nCAST CONTINUITY: ' + '; '.join(description for name, description in cast_profiles.items() if name in visual)
    if 'Jacob' in visual:
        cast += f'; CURRENT JACOB AGE: {"adult with dark hair in exile" if chapter < 31 else "mature weathered dark-grey-haired man" if chapter < 37 else "very elderly white-haired father with a long white beard"}'
    if 'Joseph' in visual:
        cast += f'; CURRENT JOSEPH AGE: {"seventeen, dark curls and beardless" if chapter == 37 else "young adult with dark curls, plain linen and no gold" if chapter <= 40 else "thirty, freshly clean-shaven, plain linen until promoted" if chapter == 41 and first < 37 else "mature clean-shaven man about forty, fine ivory linen and modest gold collar" if chapter < 47 else "older clean-shaven father with greying hair in fine linen" if chapter < 50 else "older clean-shaven man with grey hair in first scenes, very elderly only in last passage"}'
    if 'Isaac' in visual:
        cast += f'; CURRENT ISAAC AGE: {"newborn or toddler according to the scene" if chapter == 21 else "sturdy clothed adolescent" if chapter == 22 else "mature adult man with dark-grey beard" if chapter <= 26 else "very elderly nearly blind father with a long white beard"}'
    scenes.append(dict(id=number, chapter=chapter, first=first, last=last, title=title,
                       kind=kind, visual=visual, verses=verses, image=overrides.get(str(number), f'genesis-{number:03}-right-v1.jpg'),
                       source=f'https://www.bible.com/ko/bible/88/GEN.{chapter}.KRV',
                       prompt=style + f'\nPassage: Genesis {chapter}:{first}–{last}.\nPRIMARY SCENE: ' + visual + cast))
for chapter in source['chapters']:
    assert [v for s in scenes if s['chapter'] == chapter['chapter'] for v in s['verses']] == chapter['verses']
assert len(source['chapters']) == 50
assert sum(len(c['verses']) for c in source['chapters']) == 1533
data = dict(book='창세기', translation='개역한글', attribution='성경전서 개역한글판 © 대한성서공회 1961.',
            source='https://github.com/yuhwan/Bible-krv', verification='https://www.bible.com/ko/bible/88/GEN.1.KRV',
            copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',
            chapters=50, verseCount=1533, sceneCount=len(scenes), scenes=scenes)
(root / 'data/genesis.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
(root / 'genesis-image-plan.json').write_text(json.dumps(dict(method='built-in image_gen; maximum 10 concurrent calls',
    images=[{k: s[k] for k in ['id', 'chapter', 'first', 'last', 'title', 'kind', 'image', 'prompt']} for s in scenes]),
    ensure_ascii=False, indent=2) + '\n')
print(f'{len(scenes)} contexts; 50 chapters and 1533 unchanged verses, no gaps or overlaps.')
