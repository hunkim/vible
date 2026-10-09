# Jesus’ words formatting

The reader and shared HTML highlight Jesus’ speech in warm red with weight 600. All existing Bible text is preserved, including copying, annotations and share-card text. Romans and Old Testament narration receive no inferred Jesus-speech formatting.

Verse identification uses BSB Publishing’s public-domain red-letter USFM release v5.16: https://github.com/BSB-publishing/bsb2usfm/releases/tag/v5.16 . `\\wj` is the USFM Words of Jesus marker: https://docs.usfm.bible/usfm/3.1.2/char/features/wj.html . Speech boundaries follow that edition (including John 3:16–21). Unidentified heavenly voices in Acts 10:13, 10:15, 11:7 and 11:9 are excluded. Quotations explicitly recalling Jesus’ words retain emphasis.

Source archive: https://github.com/BSB-publishing/bsb2usfm/releases/download/v5.16/BSB_usfm.zip
SHA-256: `771eb584936e854b68c51a890a7de341697cda42d8515f9f279fbb3e83479a77`

Regenerate with `python3 import-jesus-words.py /path/to/BSB_usfm.zip`, then run `npm run check`. The importer maps speech onto unchanged English, Korean, Japanese and Chinese texts, with audited exceptions for speaker changes and narration in the same verse. Japanese John 9:7’s parenthetical narrator translation remains ordinary text. Chinese Acts 9:10 only reports Jesus calling rather than quoting his words; Revelation 2:27 is bridged into 2:26. These explain two fewer Chinese annotation records.

Each verse includes a text fingerprint. If a translation changes, formatting falls back to ordinary text until the ranges are regenerated and reviewed. Offsets currently target the BMP scripture text; the check rejects supplementary characters so a future text update cannot silently shift emphasis.
