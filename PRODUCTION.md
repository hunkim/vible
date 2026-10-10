# Production source

This commit contains the source of the verified Vible production release recorded
in `production-release.json`. Korean, English, Japanese and Chinese Scripture,
reader/share/search code, feedback intake, and released scene plans are included.

Full-resolution new artwork is hosted in the existing public R2 bucket through
https://images.vible.now/assets/. `asset-hosting.json` records each filename,
SHA-256 and size. New JPEG binaries are not duplicated in Git; older tracked
artwork remains in history. The normal build uses the CDN manifest, while pending
scenes use the included SVG placeholder.

Run `npm ci` and `npm run build` to rebuild. Production secrets must be supplied
through Vercel environment variables. Private feedback reports and comparison
thumbnails, local review files, credentials and in-progress generation drafts
are excluded from this release commit.
