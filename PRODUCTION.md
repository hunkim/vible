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

## Deployment workflow audit (2026-10-12)

The old sequence ran a CLI production deploy and then pushed a release-record
commit to main, triggering a second Git deployment. Records also retained stale
`gitCommit`/`frozenSource` fields while newer `sourceCommit` fields were added.
The local generation checkout contains many concurrent drafts and is not a
production source.

Use AGENTS.md's Git-only workflow. `scripts/release-preflight.mjs` checks current
main/production ancestry and all tracked archive bytes before the fast-forward
push. The public, uncached `/release.json` identifies the actual deployed source
commit. Vercel's `ignoreCommand` skips a release-record-only change only when
there are no code/content changes since the last successful deployment; missing
Git history conservatively builds. A metadata record is written only after live
verification, and never replaces a concurrently advanced main.

These guards reduce accidental stale releases but do not create a distributed
lock: a concurrent main push still requires reconciliation and revalidation.
Never bypass them with a working-tree CLI deploy. Full-resolution new art stays
in versioned R2 objects; old art, Scripture and all language data are retained.
