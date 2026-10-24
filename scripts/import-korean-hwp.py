#!/usr/bin/env python3
"""Import user-supplied Gaeyeok Gaejeong HWP text without changing scene layout."""
import argparse
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOKS = {
    '창세기': 'genesis', '출애굽기': 'exodus', '레위기': 'leviticus',
    '민수기': 'numbers', '신명기': 'deuteronomy', '여호수아': 'joshua',
    '사사기': 'judges', '룻기': 'ruth', '사무엘상': '1samuel',
    '사무엘하': '2samuel', '열왕기상': '1kings', '열왕기하': '2kings',
    '역대상': '1chronicles', '역대하': '2chronicles', '에스라': 'ezra',
    '느헤미야': 'nehemiah', '에스더': 'esther', '욥기': 'job',
    '시편': 'psalms', '잠언': 'proverbs', '전도서': 'ecclesiastes',
    '아가': 'songofsongs', '이사야': 'isaiah', '예레미야': 'jeremiah',
    '예레미아애가': 'lamentations', '에스겔': 'ezekiel', '다니엘': 'daniel',
    '호세아': 'hosea', '요엘': 'joel', '아모스': 'amos',
    '오바댜': 'obadiah', '요나': 'jonah', '미가': 'micah',
    '나훔': 'nahum', '하박국': 'habakkuk', '스바냐': 'zephaniah',
    '학개': 'haggai', '스가랴': 'zechariah', '말라기': 'malachi',
    '마태복음': 'matthew', '마가복음': 'mark', '누가복음': 'luke',
    '요한복음': 'john', '사도행전': 'acts', '로마서': 'romans',
    '고린도전서': '1corinthians', '고린도후서': '2corinthians',
    '갈라디아서': 'galatians', '에베소서': 'ephesians', '빌립보서': 'philippians',
    '골로새서': 'colossians', '데살로니가전서': '1thessalonians',
    '데살로니가후서': '2thessalonians', '디모데전서': '1timothy',
    '디모데후서': '2timothy', '디도서': 'titus', '빌레몬서': 'philemon',
    '히브리서': 'hebrews', '야고보서': 'james', '베드로전서': '1peter',
    '베드로후서': '2peter', '요한일서': '1john', '요한이서': '2john',
    '요한삼서': '3john', '유다서': 'jude', '요한계시록': 'revelation',
}
ATTRIBUTION = '성경전서 개역개정판 © 대한성서공회 1998.'
SOURCE = 'https://www.bskorea.or.kr/'
LICENSE_SOURCE = 'https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5'


def extract(path):
    result = subprocess.run(['hwp5txt', str(path)], check=True, capture_output=True, text=True)
    verses = {}
    combined = {}
    previous = None
    for number, raw in enumerate(result.stdout.splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        match = re.fullmatch(r'([가-힣]+)(\d+):(?:(\d+)(?:-(\d+))?\s+)?(.*)', line)
        if not match:
            raise ValueError(f'{path.name}:{number}: unrecognized line: {line}')
        _, chapter, verse, end_verse, text = match.groups()
        chapter = int(chapter)
        if verse is None:
            if re.fullmatch(r'제[일이삼사오]권', text):
                continue
            if previous is None or previous[0] != chapter:
                raise ValueError(f'{path.name}:{number}: continuation without a verse')
            verses[previous] += ' ' + text
            continue
        verse = int(verse)
        previous = (chapter, verse)
        if previous in verses:
            raise ValueError(f'{path.name}:{number}: duplicate {chapter}:{verse}')
        # HWP section headings are editorial metadata, not part of the verse.
        text = re.sub(r'^<[^>]*>\s*', '', text)
        if not text:
            raise ValueError(f'{path.name}:{number}: empty verse')
        verses[previous] = text
        if end_verse:
            for following in range(verse + 1, int(end_verse) + 1):
                combined[(chapter, following)] = verse
    return verses, combined


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('folder', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    for hwp in sorted(args.folder.glob('*.hwp')):
        korean_name = re.sub(r'^\d+-\d+', '', hwp.stem)
        book = BOOKS[korean_name]
        target = ROOT / 'data' / f'{book}.json'
        if not target.exists():
            continue
        data = json.loads(target.read_text())
        source_verses, combined = extract(hwp)
        # This HWP edition has 6:13 where the older Korean edition split 6:13–14.
        # Retain position 14 for existing scenes, translations, bookmarks and links.
        if book == 'songofsongs':
            combined[(6, 14)] = 13
        missing = []
        omitted = set()
        changed = 0
        for scene in data['scenes']:
            for verse in scene['verses']:
                key = (scene['chapter'], verse['verse'])
                if key not in source_verses and key not in combined:
                    # This edition explicitly notes 24:6b–8a as absent at verse 6.
                    if (book, *key) == ('acts', 24, 7):
                        omitted.add(key)
                        missing.append(f'{key[0]}:{key[1]} (explicitly absent)')
                        continue
                    raise ValueError(f'{book}: unexplained missing verse {key[0]}:{key[1]}')
                if key in source_verses and verse['text'] != source_verses[key]:
                    changed += 1
        chapter_numbers = {chapter for chapter, _ in source_verses}
        expected_chapters = set(range(1, data['chapters'] + 1))
        if chapter_numbers != expected_chapters:
            raise ValueError(f'{book}: chapter mismatch {sorted(expected_chapters - chapter_numbers)}')
        print(f'{book}: {len(source_verses)} source verses, {changed} changed, combined={len(combined)}, missing={missing}')
        if not args.write:
            continue
        for scene in data['scenes']:
            scene['source'] = SOURCE
            for verse in scene['verses']:
                key = (scene['chapter'], verse['verse'])
                verse.pop('endVerse', None)
                verse.pop('combinedWith', None)
                verse.pop('omitted', None)
                if key in omitted:
                    verse.update(text='', omitted=True)
                elif key in combined:
                    first = combined[key]
                    verse.update(text='', omitted=True, combinedWith=first)
                else:
                    verse['text'] = source_verses[key]
                    following = key[1] + 1
                    if (key[0], following) in combined and combined[(key[0], following)] == key[1]:
                        verse['endVerse'] = max(v for c, v in combined if c == key[0] and combined[(c, v)] == key[1])
        data.update(translation='개역개정', attribution=ATTRIBUTION, source=SOURCE,
                    verification=SOURCE, copyrightSource=LICENSE_SOURCE)
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        chapters = []
        for chapter in range(1, data['chapters'] + 1):
            verses = [{'verse': verse['verse'], 'text': verse['text']}
                      for scene in data['scenes'] if scene['chapter'] == chapter
                      for verse in scene['verses']]
            chapters.append({'chapter': chapter, 'verses': verses})
        source_data = {'book': data['book'], 'chapters': chapters}
        (ROOT / 'data' / f'{book}-source.json').write_text(
            json.dumps(source_data, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
