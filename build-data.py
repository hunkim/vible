"""Build a verse-complete visual reading edition of John from an unchanged KRV source."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
source=json.loads((ROOT/'data/john-source.json').read_text())
# chapter; verse range | editorial heading | scene or visual metaphor
outline='''
1
1-5|태초의 말씀, 생명의 빛|Visual metaphor: first sunrise over primordial water and rugged mountains, light opening the horizon; no personification of God.
6-8|빛을 증언하는 사람|John the Baptist seen from behind in coarse camel-hair clothing addressing travelers at a Judean wilderness river.
9-13|참 빛을 받아들이는 사람들|Visual metaphor: a first-century village doorway open to morning light, women and men welcoming a traveler while other doors remain shut.
14-18|말씀이 우리 가운데 거하시다|Jesus in plain undyed tunic and muted sand mantle, back view walking among ordinary men and women in an inhabited Galilean stone village, intimate human presence.
19-23|광야에서 외치는 소리|Priests and Levites questioning John at the Jordan river, John gesturing toward the wilderness path, respectful debate.
24-28|그분의 신발 끈도 풀 수 없는 사람|Close view of rough leather sandal straps beside river stones, John's humble lowered hands; teaching illustration, no baptism of Jesus shown.
29-34|하나님의 어린 양을 증언하다|John pointing toward Jesus walking along Jordan riverbank, dove above river, Jesus distant rear three-quarter view; witness to the Spirit, no halo.
35-39|와서 보라|Two disciples following Jesus along a sunlit narrow path toward a simple lodging, view from behind, invitation and discovery.
40-42|형제를 데려온 안드레|Andrew bringing his brother Simon to meet Jesus at a village doorway, Jesus seen from behind, three adults only.
43-46|빌립의 초대|Philip finding Nathanael beside a fig tree and inviting him to come, attentive original male faces, Galilean orchard.
47-51|무화과나무 아래의 나다나엘|Nathanael under a spreading fig tree looking toward Jesus, canopy opens to clear sky, Jesus rear view, no literal angel ladder.
2
1-5|포도주가 떨어진 혼인 잔치|Cana wedding courtyard with men and women, empty serving jug foreground, Jesus's mother quietly speaking with servants, modest first-century banquet.
6-8|여섯 돌항아리에 물을 채우다|Exactly six large limestone purification jars, servants filling them with water to the brim, close action in Cana courtyard.
9-12|물을 포도주로 바꾸신 첫 표적|Steward tasting rich red wine in an earthen cup, servants holding filled pitcher, bride and groom blurred in the courtyard, realistic wonder.
13-17|아버지의 집을 장사하는 집으로 만들지 말라|Jerusalem temple outer court, overturned money-changers table and scattered coins, sheep moving away, Jesus back view, no injury or strikes.
18-22|사흘 만에 일으킬 성전|Jesus teaching before immense Second Temple limestone columns, listeners misunderstanding his words about the temple of his body; no depiction of a temple actually collapsing.
23-25|사람의 마음을 아시는 분|Jesus seen from behind within a Passover crowd in Jerusalem, a variety of thoughtful listeners, human reactions rather than mind-reading effects.
3
1-4|밤에 찾아온 니고데모|Nicodemus an older scholar speaking privately with Jesus in a stone courtyard at night, warm oil-lamp illumination, Jesus face outside frame.
5-8|물과 성령으로 거듭나다|Visual metaphor: wind moving linen curtain beside a clay water basin, fig leaves beyond a courtyard, crisp material detail, no baby or literal rebirth.
9-13|땅의 일과 하늘의 일|Night courtyard dialogue, Nicodemus listening with a partially unrolled scroll on his knees, Jesus seen from rear, starlit sky and usable lamplight.
14-15|광야에서 들린 뱀처럼|Scripture comparison: ancient Israel wilderness encampment with a bronze serpent elevated on a simple pole, distant tents and people looking up, no injury.
16-18|세상을 사랑하신 하나님|Visual metaphor: diverse first-century families in a sunlit village, a doorway welcoming the weary; convey grace and offered life, no human image of God.
19-21|빛으로 나아오는 사람|Visual metaphor: solitary adult crossing from a shaded stone passage into open daylight, visible landscape and hopeful movement.
22-26|두 곳의 세례와 제자들의 질문|Judean springs near Aenon, John and his disciples with people approaching the water, calm conversation and crowded riverbanks.
27-30|그는 흥하고 나는 쇠하다|John quietly stepping aside while travelers follow the distant Jesus, wide wilderness path, humble posture, balanced light.
31-36|위로부터 오시는 분의 증언|Jesus back view teaching by a river with men and women listening, open sky above, no supernatural descending figure.
4
1-6|사마리아를 지나 우물에 앉으시다|Jesus resting beside Jacob's deep stone well at midday near Sychar, travel dust and sunlit Samaritan hills, empty water jar not yet present.
7-9|물을 좀 달라|A Samaritan woman arriving with a clay water jar at Jacob's well, Jesus seated back three-quarter view, two people separated by the well rim, noon daylight.
10-15|다시 목마르지 않는 생수|Teaching metaphor: close view of a Samaritan woman's naturally connected hands holding a clay cup on the RIGHT, clear water being poured from a handheld small clay pitcher above it; softly blurred limestone and olive grove on the LEFT, ordinary downward water flow, no tap, pipe, spout or spring emerging from the well wall, no light effects.
16-19|나의 삶을 아시는 분|Samaritan woman pausing thoughtfully beside the well, respectful human emotion, Jesus back view listening, no invented husbands or romantic scenes.
20-24|신령과 진정으로 드리는 예배|Woman and Jesus talking beside the well with Mount Gerizim beyond, open spacious landscape, no invented sanctuary or ritual.
25-26|네게 말하는 내가 그로라|Samaritan woman's original face in an attentive hopeful three-quarter profile, Jesus's shoulder in foreground, simple well and daylight.
27-30|물동이를 두고 마을로|Abandoned clay water jar foreground by the well, woman walking rapidly toward Sychar village with townspeople emerging, no text.
31-34|아버지의 뜻을 이루는 양식|Disciples offering bread to Jesus at the well, Jesus gesturing outward to the village, rear view; food not a miraculous banquet.
35-38|눈을 들어 추수할 밭을 보라|Teaching metaphor: ripe grain field stretching beside the Samaritan village, workers sowing and harvesting seen at distance, golden daylight.
39-42|우리가 친히 듣고 믿노라|Samaritan women and men gathering with Jesus in a village courtyard, woman among her neighbors, calm communal listening.
43-45|다시 갈릴리로|Jesus and disciples traveling north on a Galilean hillside path, village beyond, all rear view, natural road and distance.
46-50|가라, 네 아들이 살았다|Royal official in dignified plain linen pleading with Jesus in Cana, Jesus back view, no crown or royal throne, anxious father's hands.
51-54|살아난 아들, 믿게 된 집|Royal official greeted by servants near his home and then healthy child sitting up with family, one coherent home threshold composition, joyous restrained reunion.
5
1-4|베데스다 못의 기다림|Pool near Jerusalem Sheep Gate with five colonnaded porticoes, ill people resting on mats, realistic human dignity, water surface still, no literal descending angel.
5-7|삼십팔 년의 기다림|Older man resting on a worn sleeping mat beside Bethesda pool, Jesus kneeling nearby seen from behind, unhurried compassion.
8-9|일어나 자리를 들고 걸어가라|Previously ill man now standing and carrying his rolled sleeping mat beside Bethesda colonnade, daylight and practical healed movement.
10-15|안식일에 자리를 들고 가는 사람|Religious leaders questioning the man carrying his rolled mat in Jerusalem, respectful but tense encounter; temple passage behind.
16-18|아버지께서 일하시니 나도 일한다|Jesus seen from behind addressing leaders at temple colonnade, tense audience but no attack, expansive stone architecture.
19-23|아버지와 아들의 일|Jesus teaching listeners within the temple, work of life and judgment conveyed by attentive people, no depiction of God as an old man.
24-30|사망에서 생명으로|Teaching metaphor: passage from a rock-cut tomb's shade toward an open sunlit garden, open path, no body or ghosts.
31-38|예수님을 증언하는 것들|Foreground oil lamp beside open parchment scroll, temple teaching gathering beyond, witness and works conveyed without magic.
39-47|성경이 가리키는 분|Hands carefully opening a Hebrew-era parchment scroll while Jesus stands beyond from rear, readable emphasis is HTML only, parchment marks indistinct.
6
1-4|바다 건너 산으로 모인 무리|Vast crowd approaching a grassy Galilean hillside beside Lake Tiberias, Jesus and disciples small at top, immense cinematic depth.
5-9|보리떡 다섯 개, 물고기 두 마리|Exactly five small barley loaves and two fish in a child's wicker basket, child's hands offering it to disciples, hillside setting.
10-11|앉은 사람들에게 나누어 주시다|Men and women seated in groups on green hillside, hands distributing bread and fish, Jesus back view blessing bread, no hovering food.
12-13|남은 조각, 열두 바구니|Exactly twelve wicker baskets containing remaining bread pieces on grass beside lake, close foreground and satisfied crowd beyond.
14-15|왕으로 삼으려는 무리를 떠나다|Jesus rear view walking alone up an unpopulated hillside, crowd far below, no crown.
16-18|밤바다의 바람과 파도|First-century wooden fishing boat on choppy Lake Galilee at night, disciples rowing, moonlit water and practical visibility.
19-21|내니 두려워 말라|Jesus standing walking on lake surface near disciples' boat at blue night, feet contact rippled water, rear three-quarter view, no flying or halo.
22-25|예수님을 찾아 가버나움으로|People boarding simple wooden boats in morning beside lake, distant Capernaum stone village, searching after the bread sign.
26-29|썩는 양식과 영생의 양식|Jesus back view speaking to bread-seeking crowd by Capernaum synagogue, small loaf foreground, attentive and questioning people.
30-34|광야의 만나와 참된 떡|Teaching comparison: ancient wilderness camp with pale manna scattered on ground and adults gathering it, natural scale; not a scene in Capernaum itself.
35-40|내가 곧 생명의 떡|Visual metaphor: hands offering a fresh barley loaf across a simple stone table, Jesus's plain sleeve, abundant morning light.
41-46|어디서 오셨는가 묻는 사람들|Capernaum synagogue courtyard, small groups of men and women murmuring while Jesus teaches in background, no caricature.
47-51|세상의 생명을 위한 산 떡|Visual metaphor: one round loaf broken and shared among several hands, strong natural material close-up, no flesh or blood imagery.
52-59|내 안에 거하는 생명|Jesus back view teaching inside Capernaum synagogue, people listening and debating, intimate linen and limestone; no literal eating of flesh.
60-65|이 말씀은 어렵도다|Several disciples exchanging uncertain glances outside synagogue, one attentive listener stays by Jesus, restrained truthful emotion.
66-71|우리가 누구에게로 가겠습니까|Many followers walking away on a road, twelve disciples staying with Jesus, Peter beside him, Jesus back view and wide separation.
7
1-9|아직 이르지 않은 때|Jesus in simple Galilean home speaking with his brothers before festival, mother not invented, quiet waiting and open doorway.
10-13|조용히 올라가신 초막절|Jerusalem streets with temporary leafy booths and pilgrims, Jesus rear view among arriving travelers, low-key unannounced movement.
14-18|보내신 분에게서 온 가르침|Jesus rear view teaching in Second Temple courtyard during festival, many attentive adults, monumental limestone.
19-24|겉모습보다 공의로운 판단|Temple discussion with questioning leaders, hands open in debate, healed person's rolled mat only as background allusion, no literal circumcision.
25-31|이분이 그리스도인가|Jerusalem listeners whispering and considering Jesus's words, several original male and female faces, no hostile stereotype.
32-36|나를 보내신 분께 돌아간다|Temple officers standing at a distance from Jesus teaching, blocked path and thoughtful hesitation, no actual arrest.
37-39|생수의 강이 흘러나리라|Teaching metaphor: abundant clear water flowing through dry limestone terrain, lush bank against arid surroundings, no human body fountain.
40-44|갈라진 사람들의 반응|Festival crowd divided in discussion around temple steps, multiple groups and directions, Jesus distant rear view.
45-49|그분처럼 말한 사람은 없었다|Temple officers returning empty-handed to officials, thoughtful faces and quiet testimony, no ropes or prisoner.
50-53|먼저 듣고 판단하라|Nicodemus older scholar raising an open hand during council discussion, scrolls and stone benches, others listening uneasily.
8
1-6|성전 가운데 세워진 여자|At morning temple court, fully clothed woman in plain modest robe standing with accusers at a respectful distance, Jesus crouching seen from rear, no sexualization.
7-9|죄 없는 자가 먼저 돌로 치라|Hands releasing small stones onto temple paving, accusers walking away at distance, woman safe and fully clothed, no violence.
10-11|나도 너를 정죄하지 않는다|Fully clothed woman standing alone before Jesus in now-empty temple court, relief and dignity, Jesus seen from rear.
12-20|나는 세상의 빛|Jesus rear view teaching near temple treasury, broad light entering colonnade, listening leaders, no halo.
21-30|인자를 든 후에 알게 될 것|Temple dialogue with Jesus and questioning crowd, stone columns opening to sky, foreshadowing through perspective only, no cross yet.
31-36|진리가 너희를 자유롭게 하리라|Teaching metaphor: open wooden gate and unfastened cord on limestone threshold leading to daylight, no modern metal prison.
37-41|아브라함의 자손이라는 주장|Leaders with scrolls arguing ancestry in temple courtyard, Jesus from rear listening, no genealogical diagram or invented Abraham meeting.
42-47|하나님께 속한 사람은 말씀을 듣는다|Contrasting listeners attentive and turning away from Jesus, back view of teacher, gentle human differences, no demons.
48-55|내 말을 지키는 사람의 생명|Jesus teaching in a stone court while an elder considers an open scroll, honest respectful debate, no literal immortality effects.
56-59|아브라함이 나기 전부터|Jesus leaving temple through a stone arch while opponents hold stones at distance, no strike, no literal Abraham beside him.
9
1-5|날 때부터 보지 못한 사람|A man blind from birth seated beside Jerusalem street, disciples listening to Jesus nearby, dignity and human scale, face relaxed not distorted.
6-7|실로암에서 씻고 보게 되다|Man washing clay from his eyes in Siloam pool, cupped hands and clear water, hopeful original male face, no medical gore.
8-12|내가 바로 그 사람입니다|Neighbors recognizing the now-seeing man in a Jerusalem lane, men and women surprised, man explaining with open hands.
13-17|안식일의 표적을 묻는 사람들|Healed man answering religious leaders within stone chamber, attentive faces and scrolls, balanced respectful composition.
18-23|두려움 속에서 대답하는 부모|Father and mother standing together before questioning leaders, concern and dignity, adult healed son nearby, no caricature.
24-34|전에는 못 보았지만 지금은 봅니다|Healed man standing firmly at a synagogue doorway as others send him out, natural daylight falling across his face, no physical abuse.
35-38|주여, 내가 믿습니다|Jesus back view meeting the expelled man outside stone city passage, man bowing in grateful trust.
39-41|본다고 말하는 사람들의 어두움|Temple discussion with leaders in shaded portico and healed man in sunlight beyond, visual contrast not literal blinded eyes.
10
1-6|목자의 음성을 아는 양들|Parable illustration: shepherd seen from behind calling sheep through a stone sheepfold gate, grazing hills beyond, no Jesus face.
7-10|나는 양의 문|Parable illustration: open stone sheepfold gateway with sheep entering rich pasture, safe enclosure and wide sky.
11-13|양을 버리지 않는 선한 목자|Parable illustration: shepherd standing protectively between flock and a distant wolf, no attack or blood, courageous back view.
14-18|한 무리, 한 목자|Parable illustration: flocks joining from two paths around one shepherd, olive pasture and vast hills, no modern shepherd tools.
19-21|말씀 앞에서 다시 나뉜 사람들|Jerusalem men and women discussing Jesus's shepherd teaching, temple edge and thoughtful groups, no demon caricatures.
22-26|겨울, 솔로몬 행각에서|Jesus rear view walking under Solomon's portico at winter dedication festival, cool daylight and plain cloaks, no Christmas decor.
27-30|내 손에서 빼앗을 사람이 없다|Teaching metaphor: protective shepherd hands gently sheltering a lamb, bright pasture, no literal human hand representing God.
31-39|행하시는 일을 보고 믿으라|Jesus leaving a tense temple crowd, opponents holding small stones but no attack, dignified escape through limestone passage.
40-42|요단강 저편에서 믿게 된 사람들|People gathering around Jesus by Jordan river in calm daylight, broad water and vegetation, sense of return to the beginning.
11
1-6|사랑하는 사람이 병들었습니다|Martha and Mary caring for Lazarus in a Bethany home, messenger at doorway, compassionate original female faces, sick man modestly covered.
7-16|위험을 지나 친구에게로|Jesus and disciples walking toward Judea along rugged hillside path, hesitant disciples and determined teacher rear view.
17-24|무덤에 있은 지 나흘|Martha meeting Jesus on a path outside Bethany, grieving visitors distant near rock tomb, natural restraint.
25-27|나는 부활이요 생명|Martha looking at Jesus with resolute faith, olive branches and open sky beyond, Jesus shoulder foreground, original woman.
28-32|선생님이 너를 부르신다|Mary rising from a mourning room and approaching Jesus outside village, modest dark earth-tone mantle, others following at distance.
33-37|예수께서 눈물을 흘리시다|Close compassionate human gesture: Jesus's lowered hand beside grieving Mary's hands, his face out of frame, mourning companions blurred, no melodrama.
38-40|돌을 옮겨 놓으라|People moving a heavy stone away from Lazarus's cave tomb, Martha nearby, Jesus seen from rear, daylight and realistic labor.
41-44|나사로야, 나오라|Alive Lazarus emerging upright from open rock-cut tomb wrapped in linen, family gently unbinding hands, no corpse decay or horror.
45-53|표적 뒤에 시작된 모의|Council of priests discussing around stone table, uneasy concern and parchments, not villains caricature, no violence.
54-57|에브라임에 머무시다|Jesus and disciples lodging near quiet wilderness village of Ephraim, Passover pilgrims on distant Jerusalem road, rear views.
12
1-3|집 안에 가득한 향유|Mary's hands pouring nard from alabaster vessel onto Jesus's feet, her long dark hair partly visible, Bethany supper background, respectful close-up.
4-8|향유를 둘러싼 질문|Judas seated beside small money bag gesturing about perfume, Mary and Jesus at Bethany meal, no modern coins or demon.
9-11|나사로를 보러 온 사람들|Visitors greeting living Lazarus beside Bethany home, ordinary men and women, grateful curiosity.
12-16|나귀를 타고 오시는 왕|Jesus rear view riding a young donkey into Jerusalem, adults holding palm branches, no horse or crown, bright spring daylight.
17-19|온 세상이 그분을 따른다|Large palm-bearing crowd outside Jerusalem city gate, varied faces and heights, cinematic aerial-like wide composition.
20-22|예수님을 뵙고 싶습니다|Greek festival visitors in simple Hellenistic cloaks speaking with Philip and Andrew near temple, respectful first-century variety.
23-26|한 알의 밀이 많은 열매로|Teaching metaphor: wheat seed fallen into soil foreground with mature wheat behind, realistic agrarian macro and shallow depth, no impossible mixed scale.
27-33|들리면 모든 사람을 이끌리라|Jesus praying with head inclined upward seen from behind in daylight, listeners listening to skyward sound, no literal heavenly face.
34-36|빛이 있는 동안에 걸어가라|Teaching metaphor: travelers moving along illuminated stone lane before dusk, clear path contrasted with shadow, no halo.
37-43|사람의 영광과 하나님의 영광|Leaders standing privately in temple shadow while public crowd passes, conflicted restrained faces, no modern status symbols.
44-50|심판보다 구원을 위해 오신 빛|Jesus rear view addressing mixed listeners in open courtyard filled with daylight, welcome and attentive humanity.
13
1-5|끝까지 사랑하신 분|Jesus kneeling with a linen towel at low supper table to wash disciples' feet, face outside frame, oil-lamp-lit stone upper room, no Eucharist ritual invented.
6-11|내 발도 씻기시겠습니까|Peter hesitating while Jesus's hands wash his feet in a plain basin, first-century upper room, compassionate tactile detail.
12-17|너희도 서로 씻겨 주라|Disciples thoughtfully considering basin and towel at supper table, one helping another, Jesus back view teaching, lamplight.
18-20|보낸 사람을 영접하는 것|Jesus speaking to disciples around low table in upper room, open doorway beyond, intimate commissioned welcome.
21-26|너희 중 하나가 나를 팔리라|Jesus's hand offering dipped piece of bread to Judas over supper table, tense disciples in background, focus hands not Jesus face.
27-30|유다가 나간 밤|Judas rear view exiting illuminated upper-room doorway into blue night, money bag discreet at belt, no demon or monstrous face.
31-35|새 계명, 서로 사랑하라|Disciples at low supper table with Jesus's plain-sleeved hands open toward them, human friendship and warmth, no written words.
36-38|닭이 울기 전에|Peter speaking earnestly with Jesus at supper table, Jesus rear shoulder visible, quiet impending vulnerability, no rooster yet as actual event.
14
1-4|너희를 위한 처소|Teaching metaphor: welcoming first-century stone home with several open rooms and lit doorways at dusk, no literal heavenly palace.
5-7|내가 곧 길이요 진리요 생명|Teaching metaphor: single stone path leading through olive hills toward an open house, natural guiding light, no signs or text.
8-11|나를 본 사람은 아버지를 보았다|Philip asking Jesus an earnest question at upper-room table, Jesus face out of frame, no portrait of God.
12-14|내 이름으로 구하라|Disciples' hands resting in prayer beside simple bread and water at upper-room table, natural lamp light, no glowing particles.
15-17|너희와 함께할 보혜사|Teaching metaphor: warm oil lamp beside open window with gently moving curtain, breath and presence represented subtly, no personification of Spirit.
18-24|너희를 고아로 버려두지 않겠다|Jesus seen from rear comforting the remaining disciples in upper room, welcoming open hands and attentive men, no invented orphan children.
25-27|너희에게 주는 평안|Calm low supper table, small olive oil lamp and untroubled water in basin, disciples quiet beyond, peaceful upper room.
28-31|일어나, 여기를 떠나자|Jesus and remaining disciples rising from upper room and moving toward open doorway into night, practical lamp light, rear views.
15
1-3|참 포도나무와 농부|Parable illustration: gnarled grapevine cared for by farmer's hands with simple pruning knife, flourishing leaves and stone terrace.
4-8|내 안에 거하라|Parable illustration: close grapevine branch visibly connected to sturdy trunk, ripe grapes and one withered severed branch below, realistic botany.
9-11|나의 사랑 안에 머물러라|Teaching illustration: sheltered grape arbor with healthy fruit and gentle evening sun, serene sense of abiding, no faces needed.
12-17|친구를 위해 내어주는 사랑|Jesus rear view speaking intimately with disciples beside olive garden path, one disciple helping another up a step, friendship without invented battle.
18-25|세상이 너희를 미워하더라도|Disciples walking a village lane while some people turn away, no physical assault, evening practicality and solidarity.
26-27|처음부터 함께한 증인들|Small group of disciples together on a stone path, listening and ready to bear witness, Jesus back view in distance.
16
1-4|넘어지지 않도록 미리 말씀하다|Disciples listening gravely to Jesus near a synagogue doorway, exclusion foreshadowed with closed door, no killing shown.
5-7|떠나심과 보혜사의 약속|Jesus back view and sorrowful disciples on olive path at night, practical lamplight preserving visibility, one open hand comforting.
8-11|죄와 의와 심판을 밝히는 성령|Teaching metaphor: morning light revealing a stone court and open scroll, no supernatural judge or spirit character.
12-15|진리 가운데로 인도하시다|Teaching metaphor: oil lamp lighting a narrow ancient path with a scroll resting on stone, linen curtain moved by wind, no glowing script.
16-19|조금 후에 다시 보리라|Disciples asking one another about Jesus's departure, thoughtful original faces at upper-room threshold, no double Jesus figure.
20-22|근심이 기쁨으로|Explicit teaching comparison: fully clothed mother holding peacefully swaddled newborn in a modest ancient home, no childbirth depiction, relieved joy.
23-28|구하라, 기쁨이 충만하리라|Disciples prayerful hands around simple table, Jesus plain sleeve at edge, fatherly love conveyed without human image of God.
29-33|담대하라, 내가 세상을 이기었다|Jesus rear view steady on a windswept olive path as disciples gather close, hopeful horizon and natural night-before-dawn ambience.
17
1-5|아버지여, 때가 이르렀습니다|Jesus rear view lifting his eyes toward sky in prayer on quiet olive terrace at night, natural lamplight and stars, no image of God.
6-10|주신 사람들을 위한 기도|Jesus praying with disciples quietly nearby, human solidarity and stillness, no extra crowd or heavenly bodies.
11-13|저희도 하나가 되게 하옵소서|Disciples close together on olive terrace, quiet attentive original male faces and shared lamplight, Jesus seen from rear.
14-19|진리로 거룩하게 하옵소서|Teaching metaphor: unrolled parchment beside a lit oil lamp with a doorway opening toward the world, no readable generated writing.
20-23|앞으로 믿을 사람들도 하나로|Prayer illustration: diverse first-century women and men gathered peacefully across a village courtyard, future believers represented as illustration, not people literally at Jesus's prayer.
24-26|내 안에 있는 사랑|Jesus rear view in prayer beneath olive branches, disciples nearby, quiet closeness and dawn anticipation, no literal heaven scene.
18
1-3|횃불이 다가오는 동산|Jesus and disciples in garden across Kidron brook, soldiers approaching with torches and lanterns, night light realistic and readable.
4-9|너희가 누구를 찾느냐|Jesus standing calmly facing soldiers from rear as several step back and lower themselves, disciples behind, no combat.
10-11|검을 집에 꽂으라|Peter's hands lowering a short sword into its sheath while Jesus gestures to stop, no injured ear, no blood, garden torchlight.
12-14|결박되어 안나스에게|Jesus fully clothed seen from rear with loosely bound wrists escorted to stone courtyard, dignified nonviolent framing, no bruises.
15-18|문 앞에서의 첫 부인|Peter at high-priest courtyard doorway responding to a female doorkeeper, charcoal fire beyond, cold night and anxious original faces.
19-24|드러내어 말한 가르침|Jesus back view answering Annas in a stone hall, guard nearby with hands lowered, no strike shown, simple practical lights.
25-27|숯불 곁, 그리고 닭 울음|Peter beside charcoal fire avoiding questioning eyes, rooster at distant courtyard edge under early dawn, no tears mandated.
28-32|새벽의 관정|Religious officials standing outside Roman praetorium while Pilate steps out to meet them, dawn Jerusalem stone architecture.
33-38|내 나라는 이 세상에 속하지 않는다|Pilate in Roman tunic speaking privately with Jesus rear view inside praetorium, spare grand architecture, no crown yet.
39-40|바라바를 놓아 달라는 사람들|Crowd outside praetorium choosing release of Barabbas, Pilate above steps, no modern prison or violence.
19
1-3|가시관과 자색 옷|Symbolic object close-up: woven thorn crown resting on purple cloth on Roman stone bench, guards distant, no torture shown.
4-7|보라, 이 사람이다|Jesus fully clothed in purple mantle rear three-quarter view presented on praetorium steps, Pilate beside him and distant crowd, no blood or injury.
8-11|위에서 주지 않은 권세는 없다|Pilate questioning silent Jesus in stone hall, tense restrained mood, Jesus face hidden from camera, no violence.
12-16|재판석에서 내린 결정|Pilate seated on tribunal at stone pavement Gabbatha, crowd below, Jesus standing rear view with guards distant, no attack.
17-22|골고다의 십자가|Three crosses on a distant rocky hill outside Jerusalem, middle cross central, figures tiny and clothed, respectful distant non-graphic view, no generated inscription.
23-24|나뉜 옷, 찢지 않은 속옷|Roman soldiers' hands casting lots beside folded seamless linen tunic, Golgotha rocky ground, crosses outside frame, no body visible.
25-27|보라, 네 어머니라|Four fully clothed women including Jesus's mother and beloved disciple gathered at foot of a cross, camera on mourners' backs, crossbeam above frame, no wounds shown.
28-30|다 이루었다|A vessel of sour wine and sponge on hyssop foreground with distant central cross under subdued natural sky, non-graphic, quiet solemn completion.
31-37|참된 증인의 기록|Roman soldier's lowered spear beside cross's wooden base, linen and rocky ground, no body or piercing shown, restrained witness illustration.
38-42|향품과 세마포, 새 무덤|Joseph and Nicodemus carrying a fully wrapped burial bundle into garden rock-cut tomb, clay jars of spices and linen, no visible corpse.
20
1-2|돌이 옮겨진 아침|Mary Magdalene in modest earth-tone mantle arriving at open garden tomb before sunrise, rolling stone moved aside, recognizable empty threshold.
3-10|달려온 두 제자와 세마포|Peter and beloved disciple at empty rock tomb, folded head cloth separately placed beside linen burial cloth on stone bench, no body.
11-13|무덤 앞에서 울고 있는 마리아|Mary Magdalene looking into tomb with two simply white-clothed messengers seated at opposite ends of empty bench, no wings or magic light.
14-16|마리아야|Mary Magdalene turning in recognition toward Jesus standing behind her in garden, Jesus back three-quarter view, morning light and original woman's face.
17-18|내가 주님을 보았습니다|Mary Magdalene arriving to tell disciples at a stone home's doorway, urgent joyful expression, no one gripping Jesus.
19-23|닫힌 문 안에 찾아온 평강|Jesus rear view standing among surprised then joyful disciples in closed stone room, natural evening lamp light, hands open, no portal effects.
24-25|도마의 질문|Thomas listening skeptically to disciples' testimony in a plain stone room, hands held thoughtfully, no Jesus present.
26-29|나의 주시며 나의 하나님|Thomas facing Jesus with humble trusting posture, Jesus's open hand visible with subtle healed small mark only, no wounds close-up, no finger insertion.
30-31|믿고 생명을 얻게 하려 기록하다|Hands writing on parchment beside oil lamp, stacks of scrolls and morning window, readable text added only in app, editorial image of testimony.
21
1-3|밤새 아무것도 잡지 못하다|Seven disciples in wooden fishing boat on Lake Tiberias at night, empty nets and still blue water, realistic visibility.
4-6|배 오른편에 그물을 던지라|Seven fishermen pulling full net on right side of wooden boat at dawn, Jesus distant rear view on shoreline, no flying fish.
7-8|주시다! 물로 뛰어든 베드로|Peter fully clothed in outer garment wading or swimming toward lakeshore, other disciples guiding fishing boat and full net behind, no nudity.
9-11|숯불 위의 생선과 떡|Charcoal fire with fish and bread on lakeshore foreground, loaded fishing net nearby, seven disciples approaching, dawn calm, do not invent exact fish count visually.
12-14|와서 아침을 먹으라|Jesus's plain-sleeved hands sharing bread with seven disciples at lakeshore breakfast, small charcoal fire and fish, warm dawn natural light.
15-17|네가 나를 사랑하느냐|Peter and Jesus quietly speaking apart from breakfast by lake, Jesus back view, Peter's deeply moved original face, no invented sheep in actual scene.
18-19|나를 따르라|Jesus and Peter walking along lakeshore from rear, morning light and distant boat, no future crucifixion of Peter shown.
20-23|그 사람이 아니라 너는 나를 따르라|Peter looking back toward beloved disciple following at distance, Jesus ahead along shoreline, calm three-person geometry.
24-25|세상도 담을 수 없는 이야기|Editorial metaphor: open parchment scroll and many rolled scrolls on a stone desk overlooking lake and horizon, no modern book or readable generated text.
'''
chapter=None
scenes=[]
for line in outline.strip().splitlines():
    if line.isdigit():chapter=int(line);continue
    verse_range,title,visual=line.split('|')
    first,last=map(int,verse_range.split('-'))
    verses=source['chapters'][chapter-1]['verses'][first-1:last]
    assert [v['verse'] for v in verses]==list(range(first,last+1))
    kind='metaphor' if any(w in visual.lower() for w in ['metaphor','parable illustration','teaching comparison','teaching illustration','scripture comparison','prayer illustration','editorial image']) else 'narrative'
    scenes.append(dict(id=len(scenes)+1,chapter=chapter,first=first,last=last,title=title,kind=kind,visual=visual,verses=verses,image=f'john-{len(scenes)+1:03}.jpg',source=f'https://www.bible.com/ko/bible/88/JHN.{chapter}.KRV'))
for c in source['chapters']:
    covered=[v['verse'] for s in scenes if s['chapter']==c['chapter'] for v in s['verses']]
    assert covered==[v['verse'] for v in c['verses']],c['chapter']
style='''Use case: historical-scene. Asset: Visual Bible context illustration, one cinematic 16:9 landscape frame. Large-format photorealistic historical epic, natural-light realism, rich visual depth with foreground/midground/background, 28–50mm lens, tactile limestone, weathered olive wood, undyed linen, terracotta, sage green and pale Mediterranean blue. First-century Judea, Galilee or Samaria as specified; authentic period objects and geography. Bright readable natural exposure for daytime; nighttime must remain nighttime with credible moonlight and oil lamps, never crushed shadows. Faces only when narratively needed; use varied original historically plausible West Asian women and men, never reuse one actor for all people. Jesus is a first-century Jewish man, dark wavy hair, plain undyed linen tunic and muted sand mantle, always seen from behind, distant or with face outside frame; same clothes across scenes except when passage specifies otherwise. Depict God and Holy Spirit without human faces or fantasy bodies. Humane dignity in illness and grief. No invented events, no modern objects, no magical glow, no halo, no lettering, no logos or watermarks. Compose for scripture OVERLAID on the LEFT: reserve the left 42 percent as quiet low-detail natural scenery with no main people or meaningful objects; place the principal people, props and action in the right-center 55–88 percent, with breathing room from the edges. Make the story intelligible on the right without placing anything important beneath the scripture. Keep the lower 18 percent free of essential faces or gestures for the mobile bottom overlay. Physical plausibility is mandatory: connected anatomically correct limbs, plausible joints and weight-bearing posture, feet supported by ground or an appropriate surface, natural grips, continuous coherent object structures, credible scale, gravity and perspective. Never intersect bodies with walls, furniture, vessels or boat hulls. At wells nobody sits inside the opening or puts feet into the shaft: use a separate bench outside the parapet, both sandaled feet visible on dry ground, a clear gap between legs and the shaft; buckets hang from a continuous rope over an open well. Water comes from a handled vessel or a real spring and falls downward, never from an invented faucet. Each visual metaphor must remain a visual metaphor and must not invent an event in the passage. Each image must visibly explain this specific passage and differ from neighboring shots; maintain film color and materials, avoid generic repeated valleys.'''
for scene in scenes:
    scene['prompt']=style+'\nPassage: John '+str(scene['chapter'])+':'+str(scene['first'])+'–'+str(scene['last'])+'.\nScene: '+scene['visual']
metadata=dict(book='요한복음',translation='개역한글',attribution='성경전서 개역한글판 © 대한성서공회 1961.',source='https://github.com/yuhwan/Bible-krv',verification='https://www.bible.com/ko/bible/88/JHN.1.KRV',copyrightSource='https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5',chapters=21,verseCount=sum(len(c['verses']) for c in source['chapters']),sceneCount=len(scenes),scenes=scenes)
overrides_path=ROOT/'image-overrides.json'
overrides=json.loads(overrides_path.read_text()) if overrides_path.exists() else {}
edits_path=ROOT/'continuity-edits.json'
edits={str(e['id']):e for e in json.loads(edits_path.read_text())} if edits_path.exists() else {}
for scene in scenes:
    scene['image']=overrides.get(str(scene['id']),scene['image'])
(ROOT/'data/john.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
redraws_path=ROOT/'john-right-redraws.json'
redraws={str(x['id']):x for x in json.loads(redraws_path.read_text())['images']} if redraws_path.exists() else {}
plans=[{k:s[k] for k in ['id','chapter','first','last','title','kind','image','prompt']} for s in scenes]
for plan in plans:
    if str(plan['id']) in redraws:
        plan['prompt']=redraws[str(plan['id'])]['prompt']
        plan['generationStatus']='redrawn-and-reviewed'
    else:
        plan['generationStatus']='existing-image; revised-prompt-ready'
    if str(plan['id']) in edits and str(plan['id']) not in redraws:
        edit=edits[str(plan['id'])]
        plan['editPrompt']=edit['prompt']
        plan['referenced_image_paths']=edit['referenced_image_paths']
(ROOT/'image-plan.json').write_text(json.dumps(dict(method='built-in image_gen; maximum 10 concurrent calls',images=plans),ensure_ascii=False,indent=2))
print(f'{len(scenes)} scenes, {metadata["verseCount"]} verses; no gaps or overlaps in all 21 chapters.')
