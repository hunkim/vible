#!/usr/bin/env python3
"""Import the owner's Ieum Bible published Korean draft, verbatim, from a pinned Git revision."""
import argparse, hashlib, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
SITE = 'https://ieumbible.org/'
ATTRIBUTION = '이음성경 · 전문가 검토 전 AI 번역 초안 · https://ieumbible.org/'

def load(repo, revision, file):
    return subprocess.check_output(['git', '-C', str(repo), 'show', f'{revision}:{file}'])

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repository', type=pathlib.Path)
    parser.add_argument('--revision', required=True)
    args = parser.parse_args()
    revision = subprocess.check_output(['git', '-C', str(args.repository), 'rev-parse', args.revision], text=True).strip()
    catalog = json.loads(load(args.repository, revision, 'public/data/catalog.json'))['books']
    # Both catalogs follow the canonical 66-book order; verify the order and chapter counts below.
    books = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {bibleBooks} from './bible-books.js';console.log(JSON.stringify(bibleBooks))"], cwd=ROOT))
    assert len(catalog) == len(books) == 66
    destination = ROOT / 'data/translations/ko-ieum'
    destination.mkdir(exist_ok=True)
    records = []
    for number, (source, book) in enumerate(zip(catalog, books), 1):
        assert source['order'] == number and source['available'] and source['status'] == 'reviewed-ai-draft'
        file = 'public' + source['path']
        raw = load(args.repository, revision, file)
        draft = json.loads(raw)
        base = json.loads((ROOT / f'data/{book["id"]}.json').read_text())
        assert len(draft['chapters']) == base['chapters'] == source['chapters']
        chapters = []
        for index, chapter in enumerate(draft['chapters'], 1):
            assert chapter['chapter'] == index
            verses = [{'verse': v['verse'], 'text': v['text']} for v in chapter['verses']]
            assert [v['verse'] for v in verses] == list(range(1, source['verseCounts'][index-1] + 1))
            assert all(isinstance(v['text'], str) and v['text'].strip() for v in verses)
            chapters.append({'chapter': index, 'verses': verses})
        data = {'language': 'ko', 'book': base['book'], 'translation': '이음성경', 'attribution': ATTRIBUTION,
                'source': SITE, 'licenseSource': SITE, 'downloadSource': f'https://github.com/hunkim/open-bible/blob/{revision}/{file}',
                'permissions': {'display': True, 'shareCards': True},
                'permissionBasis': 'Project owner requested Vible integration and deployment on 2026-11-06; no general public license asserted.',
                'status': 'reviewed-ai-draft; specialist review pending', 'verseNumbering': 'source',
                'sourceRevision': revision, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
                'sourceAttributions': {k: v for k, v in draft.items() if k in ['originalAttribution','originalUrl','originalLicense','originalLicenseUrl','hebrewAttribution','hebrewLicense','sourceHashes']},
                'chapterSources': {str(c['chapter']): f'{SITE}?book={source["id"]}&chapter={c["chapter"]}' for c in chapters}, 'chapters': chapters}
        target = destination / (book['id'] + '.json')
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
        records.append({'book': book['id'], 'sourceBook': source['id'], 'sourceFile': file, 'sourceSha256': data['sourceSha256'], 'chapters': len(chapters), 'verses': sum(len(c['verses']) for c in chapters)})
    registry_file = ROOT / 'data/translations/editions.json'
    registry = json.loads(registry_file.read_text())
    entry = registry['languages']['ko']
    entry['default'] = 'ieum'
    entry['editions'] = [e for e in entry['editions'] if e['id'] != 'ieum'] + [{
        'id': 'ieum', 'names': {'ko':'이음성경', 'en':'Ieum Bible', 'ja':'イウム聖書', 'zh':'Ieum 圣经'},
        'translation': '이음성경', 'attribution': ATTRIBUTION, 'source': SITE, 'licenseSource': SITE,
        'path': 'ko-ieum', 'books': [v['id'] for v in books], 'permissions': {'display': True, 'shareCards': True}}]
    registry_file.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n')
    report = {'sourceRepository': 'hunkim/open-bible', 'sourceRevision': revision, 'sourceWebsite': SITE,
              'defaultKoreanEdition': 'ieum', 'wording': 'verbatim; no machine translation or fallback text',
              'books': records, 'bookCount': len(records), 'chapters': sum(r['chapters'] for r in records), 'verses': sum(r['verses'] for r in records)}
    (ROOT / 'ieum-text-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(f'Imported {len(records)} books, {report["chapters"]} chapters, {report["verses"]} verses from {revision}')

if __name__ == '__main__':
    main()
