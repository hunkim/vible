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

## Jeremiah (2026-10-12)

All 53 published books now include Korean, English, Japanese and simplified Chinese Scripture. Jeremiah (예레미야) uses Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON re-downloaded on 2026-10-12; SHA-256 `582d8ad8…5f76` matches the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/jcb_ot_24_jer.htm` (retrieved 2026-10-12; SHA-256 recorded in its translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text.

All 52 chapters and 1,364 Korean verse positions are preserved. BSB and the 1955 Colloquial have exactly the KRV verse numbers in every chapter, with no bridges or omissions; all three follow the English chapter boundary (8:22 is the balm of Gilead and 9:1 begins "my head were waters"), as does OpenCCB, so no verse was moved. OpenCCB prints 11 combined verses, kept as printed without filling the second number from another text: 11:21–22, 17:2–3, 19:1–2, 27:19–20, 29:1–2, 32:9–10, 34:18–19, 36:23–24, 41:13–14, 43:5–7 and 51:59–60. 개역한글 prints 21:1–2 as one verse (the electronic source gives 21:2 as `[1절과 같음]`); like Acts 15:25–26 and Romans 9:1–2 it is shown and shared as the combined verse 21:1–2, the placeholder kept only in the source file and never displayed.

## Ezekiel and Hosea (2026-10-12)

All 55 published books now include Korean, English, Japanese and simplified Chinese Scripture. Ezekiel (에스겔) and Hosea (호세아) use Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON re-downloaded on 2026-10-12; SHA-256 `342ce056…5acf` and `d2116f55…a83b` match the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/jcb_ot_26_ezk.htm` and `https://www.ogccl.org/jcb/jcb_ot_28_hos.htm` (retrieved 2026-10-12; SHA-256 recorded in each translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text.

All 48 + 14 chapters and 1,273 + 197 Korean verse positions are preserved. 개역한글 follows the English chapter boundaries where the Hebrew numbering differs (Ezekiel 20:45–49 rather than 21:1–5; Hosea 1:10–11 rather than 2:1–2, 11:12 rather than 12:1, 13:16 rather than 14:1). BSB, the 1955 Colloquial and OpenCCB use the same boundaries; the boundary verses were compared in all four editions, so no verse was moved, dropped or duplicated. BSB and the 1955 Colloquial have no bridges or omissions in either book; OpenCCB prints Ezekiel 16:56–57 and 41:9–10 as combined verses, kept as printed without filling the second number from another text. 개역한글 prints Ezekiel 24:4–5 as one verse (the electronic source gives 24:5 as `[4절과 같음]`); like Jeremiah 21:1–2 it is shown, searched and shared as the combined verse 24:4–5, the placeholder kept only in the source file and never displayed. Hosea has no combined verses in any edition.

## Isaiah (2026-10-13)

All 56 published books now include Korean, English, Japanese and simplified Chinese Scripture. Isaiah (이사야) uses Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON re-downloaded on 2026-10-13; SHA-256 `1fbd2346…82c4c` matches the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/jcb_ot_23_isa.htm` (retrieved 2026-10-13; SHA-256 recorded in its translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text.

All 66 chapters and 1,292 Korean verse positions are preserved. 개역한글 follows the English chapter boundaries where the Hebrew numbering differs (8:22 then 9:1 "전에 고통하던 자에게는 흑암이 없으리로다" rather than Hebrew 8:23, 9:2 the great light rather than 9:1, and 64:1 "하늘을 가르고" rather than Hebrew 63:19b). BSB, the 1955 Colloquial and OpenCCB use the same boundaries and the same verse count in every chapter; the boundary verses were compared in all four editions, so no verse was moved, dropped or duplicated. BSB has no bridges or omissions in Isaiah. Combined verses are kept as printed, without filling the second number from another text: the 1955 Colloquial prints 4:3–4 (labelled `3 4:4`); OpenCCB prints 4:3–4, 10:1–2 and 65:6–7. 개역한글 prints 7:8–9, 30:1–2 and 48:1–2 as one verse (the electronic source gives 7:9 as `8절과 같음` and 30:2 and 48:2 as `[1절과 같음]`); like Jeremiah 21:1–2 and Ezekiel 24:4–5 they are shown, searched and shared as combined verses, the placeholders kept only in the source file and never displayed.

## Joel–Malachi: all 66 books (2026-10-13)

All 66 books now include Korean, English, Japanese and simplified Chinese Scripture; no book remains coming soon. Joel (요엘), Amos (아모스), Obadiah (오바댜), Micah (미가), Nahum (나훔), Habakkuk (하박국), Zephaniah (스바냐), Haggai (학개), Zechariah (스가랴) and Malachi (말라기) use Korean 개역한글 (1961) from `yuhwan/Bible-krv` (raw JSON re-downloaded on 2026-10-13; SHA-256 `e47ed75d…41aa`, `c767bb52…a596`, `0f94b6c2…8329`, `cc7f6ad2…c49a`, `3a8d7e65…5ef3`, `6dd9e609…f943`, `db8b4d64…aeb4`, `348e5b56…e25c`, `b822db1e…ae6a` and `2f079108…e22a` match the recorded source preparation), English BSB (Public Domain) and Chinese OpenCCB (2022, CC BY-SA 4.0) from the same verified 2026-10-09 eBible archives, and Japanese 口語訳聖書（1955年版） from `https://www.ogccl.org/jcb/` (`jcb_ot_29_joel.htm`, `jcb_ot_30_amos.htm`, `jcb_ot_31_obad.htm`, `jcb_ot_33_micah.htm`, `jcb_ot_34_nahum.htm`, `jcb_ot_35_hab.htm`, `jcb_ot_36_zeph.htm`, `jcb_ot_37_hag.htm`, `jcb_ot_38_zech.htm`, `jcb_ot_39_mal.htm`, retrieved 2026-10-13; each file's SHA-256 is recorded in its translation JSON). Only ruby pronunciation markup and HTML formatting are removed from the Japanese text. The app keeps the catalog's Japanese book name ゼファニヤ書; the 1955 Colloquial's own name ゼパニヤ書 is accepted in search.

Every chapter and all 805 Korean verse positions are preserved (73, 146, 21, 105, 47, 56, 53, 38, 211 and 55). 개역한글 follows the English chapter and verse boundaries where the Hebrew numbering differs: Joel 2:28–32 and 3:1–21 (Hebrew 3:1–5 and 4:1–21), Micah 5:1 (Hebrew 4:14), Nahum 1:15 (Hebrew 2:1), Zechariah 1:18–21 (Hebrew 2:1–4) and Malachi 4:1–6 (Hebrew 3:19–24). BSB, the 1955 Colloquial and OpenCCB use the same boundaries and the same verse count in every chapter; the boundary verses were compared in all four editions, so no verse was moved, dropped or duplicated. The Korean source has no `[n절과 같음]` placeholders or omitted verses in these books. BSB and the 1955 Colloquial have no bridges or omissions; OpenCCB prints Zephaniah 2:1–2 and 2:8–9 as combined verses, kept as printed without filling the second number from another text.
