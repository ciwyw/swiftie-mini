---
name: live-video-pipeline
description: Use when managing the Swiftie live video workflow in this repo, especially when downloading new YouTube live videos, syncing videos and covers to R2, checking missing catalog metadata, or upserting rows into live_videos.
---

# Live Video Pipeline

## Overview
This skill is the operating guide for the repo's live-video ingestion flow. Use the existing scripts as the only execution path; do not hand-roll ad hoc download, R2, or D1 commands unless you are actively debugging the pipeline.

## When to Use
- New live videos need to be downloaded from the configured YouTube playlist.
- Local files in `~/Downloads/live` need to be synced to R2.
- Cover images need to be generated or refreshed.
- A video exists locally or in R2 but is missing from `live_videos`.
- The library live list or player page is missing an expected item.

Do not use this skill for tour fan-cam uploads in `videos`; this skill is only for library `live_videos`.

## Source Of Truth
- Pipeline entrypoint: `npm run live:process`
- Catalog check: `npm run live:check:catalog`
- Cover refresh: `npm run live:process:refresh-covers`
- Download/archive script: [scripts/ytb-download.sh](/Users/bytedance/projects/swiftie-mini/scripts/ytb-download.sh)
- Download archive: [scripts/ytb-archive.txt](/Users/bytedance/projects/swiftie-mini/scripts/ytb-archive.txt)
- Catalog metadata: [scripts/liveVideoCatalog.mjs](/Users/bytedance/projects/swiftie-mini/scripts/liveVideoCatalog.mjs)
- SQL generator: [scripts/sync-live-videos.mjs](/Users/bytedance/projects/swiftie-mini/scripts/sync-live-videos.mjs)

## Standard Commands
- Full workflow: `npm run live:process`
- Full workflow with explicit playlist URL: `npm run live:process -- "https://www.youtube.com/playlist?list=..."`
- Skip YouTube download and rerun downstream sync: `npm run live:process -- --skip-download`
- Force-regenerate and overwrite covers: `npm run live:process:refresh-covers`
- Catalog-only validation: `npm run live:check:catalog`

## Required Workflow
1. Run `npm run live:check:catalog` if local files may have changed outside the normal pipeline.
2. If the catalog check fails, update `scripts/liveVideoCatalog.mjs` before doing any more sync work.
3. Run `npm run live:process` for the normal path.
4. Read the final summary output and confirm what was downloaded, uploaded, skipped, and upserted.

## Catalog Rules
- `id` should be stable and slug-like, prefixed with `performance_`.
- `title` should be the track or performance title shown to users.
- `songIds` must map to real song ids already in D1.
- `eventName` should be the user-facing event/program name.
- `duration` should match the final local file duration used in the player.
- `videoFileName` must exactly match the file in `~/Downloads/live`.
- `cover` is not authored in the catalog; it is derived automatically from the video filename.

## Failure Handling
- If catalog check fails: add the missing file to `scripts/liveVideoCatalog.mjs` first.
- If mp4 upload succeeds but the app still does not show the item: rerun `npm run live:process -- --skip-download` to force the D1 upsert path.
- If the cover looks bad: run `npm run live:process:refresh-covers`.
- If R2 existence checks fail intermittently: rerun the same command; the scripts already retry remote HEAD checks.

## Guardrails
- Prefer the scripts over raw `wrangler r2 object put` or `wrangler d1 execute`.
- Do not edit `live_videos` rows manually in ad hoc SQL when the catalog can express the change.
- Keep new metadata rows in the catalog file so future reruns remain idempotent.
