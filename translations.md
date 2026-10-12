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

## Proverbs release (2026-10-11)

All 35 published books now include Korean, English BSB (Public Domain), Japanese and simplified Chinese OpenCCB (2022, CC BY-SA 4.0) Scripture. Proverbs uses Japanese 1955 Colloquial OT. All 31 chapters and 915 Korean verse positions are preserved; Chinese Proverbs 26:18–19 remains a combined verse. Art is released independently as images become available.

## Song of Songs release (2026-10-11)

All 42 published books now include Korean, English, Japanese and simplified Chinese Scripture. Song of Songs (아가) uses Korean 개역한글 (1961), English BSB (Public Domain), Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/jcb_ot_22_sofs.htm` (retrieved 2026-10-11) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives. All 8 chapters and 118 Korean verse positions are preserved. 개역한글 divides 6:13 into 6:13 and 6:14; BSB, the 1955 Colloquial and OpenCCB keep one verse 6:13, so those editions show it as a combined 6:13–14 without filling 6:14 from another text. OpenCCB's speaker labels (for example 男子：) are part of its verse text and are kept verbatim.

## Chronicles–Esther, Job, Ecclesiastes, Daniel and Jonah (2026-10-12)

All 51 published books now include Korean, English, Japanese and simplified Chinese Scripture. 1–2 Chronicles (역대상·역대하), Ezra, Nehemiah, Esther, Job, Ecclesiastes (전도서), Daniel and Jonah use Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON SHA-256 matches the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/` (`jcb_ot_13_chron1.htm`, `jcb_ot_14_chron2.htm`, `jcb_ot_15_ezra.htm`, `jcb_ot_16_neh.htm`, `jcb_ot_17_esther.htm`, `jcb_ot_18_job.htm`, `jcb_ot_21_eccles.htm`, `jcb_ot_27_dan.htm`, `jcb_ot_32_jonah.htm`, retrieved 2026-10-12; each file's SHA-256 is recorded in its translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text.

Every chapter and all 4,314 Korean verse positions are preserved (942, 822, 280, 406, 167, 1,070, 222, 357 and 48). For these books, BSB, the 1955 Colloquial and OpenCCB follow the same chapter and verse boundaries as 개역한글 (for example Jonah 1:17 is the fish verse, Daniel 4:1 opens Nebuchadnezzar's decree, and Ecclesiastes 5:1, Nehemiah 4:1 and 1 Chronicles 6:1 begin there in all four editions), so no verse was moved. Each edition's source verses are all used exactly once. Combined verses are kept as printed, without filling the second number from another text: the 1955 Colloquial prints 1 Chronicles 16:12–13; OpenCCB prints 1 Chronicles 8:6–7, 8:8–9, 16:12–13, 17:9–10; 2 Chronicles 3:11–13, 10:13–14, 30:18–19; Ezra 2:61–62, 7:8–9; Nehemiah 3:25–26, 7:63–64, 11:3–4; Esther 8:11–12; Job 38:37–38, 38:39–40; Ecclesiastes 7:27–28; Daniel 2:28–30. BSB has no bridges or omissions in these books.

## Lamentations (2026-10-12)

All 52 published books now include Korean, English, Japanese and simplified Chinese Scripture. Lamentations (예레미야애가) uses Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON SHA-256 `8ea0830a…c8cc` matches the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/jcb_ot_25_lam.htm` (retrieved 2026-10-12; SHA-256 recorded in its translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text; its poetic line breaks are joined as in the other 1955 Colloquial books.

All 5 chapters and 154 Korean verse positions are preserved (22, 22, 66, 22 and 22). The acrostic chapters have the same verse boundaries in all four editions: BSB, the 1955 Colloquial and OpenCCB have no verse bridges or omissions in Lamentations, so no verse is combined, moved or filled from another text.
