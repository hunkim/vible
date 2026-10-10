# Four-language Scripture integration

The language selector, browser-locale detection, saved preference, reading text, share URL, server-rendered share page, and PNG card use `ko`, `en`, `ja`, and `zh`. A shared URL's `lang` is authoritative, regardless of the recipient's browser locale. Chinese regional locales currently map to simplified Chinese (`zh`).

**Content status (2026-10-10):** all 34 current books have Korean, English, Japanese and simplified Chinese Scripture. English uses Berean Standard Bible (Public Domain), Chinese uses Biblica® Open Chinese Contemporary Bible™ (2022, CC BY-SA 4.0). Japanese New Testament uses 新改訳新約聖書（1965年版） and the seven current Old Testament books use 口語訳聖書（1955年版）, whose copyright term has expired according to Japan Bible Society. Japanese editions are explicitly dated and are not presented as the newest translations. Image availability is independent of text: ongoing books still show placeholders where art is unfinished.

New translated texts cache on first reading rather than downloading all 102 translations during installation. Search indexes are generated from the corresponding language text; share pages and cards retain that language and its attribution.

The importer supports all books in the app catalog. VPL and USFM archives are the previously verified downloads from 2026-10-09. Japanese OT HTML files are downloaded from `https://www.ogccl.org/jcb/` as `genesis.html`, `exodus.html`, `leviticus.html`, `numbers.html`, `deuteronomy.html`, `psalms.html`. Only ruby pronunciation markup and HTML formatting are removed. Split verse segments are joined in their labelled order; combined verses remain explicit (Numbers 15:4–5, Psalms 132:3–5). BSB 3 John 1:14 includes the greeting labelled verse 15 in other editions; this is represented as 14–15, consistent with BSB's USFM footnote.

The original verse wording is copied verbatim from eBible VPL downloads. USFM verse bridges determine combined verse labels and shared ranges. BSB's omitted verses are explicit; no Korean text fills gaps. `import-open-translations.py` imports the downloaded VPL and USFM archives, records source URLs and SHA-256 hashes, and rejects unexplained missing verses. App text stays available offline. Chinese share pages and cards carry the required Biblica attribution and CC BY-SA 4.0 notice. Scripture/card reuse is under that license; the Bible text is unmodified.

Modern translations must be obtained from an authorized publisher or licensed provider. The permissions must cover reading display and distributing verse images/link previews, including the desired attribution. Do not scrape Bible readers or replace Scripture with machine translation. Online readability alone does not establish app redistribution permission.

Publisher references checked on 2026-10-09:

- Japan Bible Society, 2018 聖書協会共同訳 and permissions: https://www.bible.or.jp/read/bible_copyright.html
- NRSVue (2021), publisher permission guidance: https://www.friendshippress.org/pages/nrsvue-quick-faq
- Biblica latest-edition permissions and digital uses: https://www.biblica.com/permissions/
- API.Bible translation-specific licensing: https://care.api.bible/article/369-understanding-api-bible-licensing

## Import authorized text

`npm run import-translation -- en john /absolute/path/licensed-john.json`

The importer validates text, metadata, chapter/verse alignment and display/card-sharing permission flags, then preserves the supplied text verbatim. These flags record confirmed permission, not a grant of permission. Confirmation must come from the provider or owner. No account signup, agreement acceptance or subscription is automated.

Expected JSON structure:

```json
{
  "language": "en",
  "book": "John",
  "translation": "AUTHORIZED EDITION NAME",
  "attribution": "EXACT REQUIRED COPYRIGHT NOTICE",
  "source": "https://publisher.example/translation",
  "licenseSource": "https://publisher.example/licensing",
  "permissions": { "display": true, "shareCards": true },
  "chapters": [
    { "chapter": 1, "verses": [{ "verse": 1, "text": "EXACT AUTHORIZED TEXT" }] }
  ]
}
```

Include every chapter and every verse position used by the current scene boundaries. For verses omitted in a modern edition, supply `{ "verse": 37, "text": "", "omitted": true }`; do not substitute text from the old edition. `sceneTitles` (scene ID to localized editorial title) and `chapterSources` (chapter to source URL) are optional. Images remain shared across languages. Remaining editorial/menu copy still requires localization before a complete four-language release.

After imports, run `npm run check`. The build generates the availability catalog from validated files and copies all translation files. Test each language in reading, switching at the current verse, sharing a range, viewing OG images, and checking copyright notices before deployment. Share pages reject a requested language that has no text rather than changing its language silently. Existing Korean-only share URLs remain compatible.

Joshua is included with authorized BSB English, 1955 Japanese Colloquial and
2022 Open Chinese Contemporary texts. All 24 chapters remain readable while
unavailable illustrations show the existing pending-art placeholder.
