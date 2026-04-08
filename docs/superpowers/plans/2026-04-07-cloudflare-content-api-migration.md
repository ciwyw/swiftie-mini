# Cloudflare Content API Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local mock content reads with real Cloudflare-backed APIs while keeping the mini-program’s current page structure, local user storage, and selector-driven view-model composition.

**Architecture:** Serve page-sized read endpoints from a `server/` Cloudflare Worker backed by D1. Static navigation pages stay zero-request; list and detail pages fetch only the data they need; runtime does not fall back to mock data and instead renders a shared error UI when requests fail.

**Tech Stack:** WeChat Mini Program native pages, TypeScript, WXML, WXSS, Cloudflare Workers, D1, `tsx --test`, `tsc --noEmit`

---

## Decisions Locked In

- Runtime does **not** fall back to mock data.
- API failure shows a shared “内容加载失败，请稍后重试” UI with a retry action.
- `pages/library/index` stays zero-request.
- `guide` page remains local-only and does not use server data.
- `show_guides` is removed as a separate table; ticketing and venue fields move into `shows`.
- `home_spotlights` is removed as a separate table; home spotlight cards are derived server-side from `albums` and `tours`.
- `home_era_cards` is removed as a separate table; home era cards are a projection of `eras`.
- Ambiguous label-style date fields are removed from the data model and UI: `rangeLabel`, `yearLabel`, `dateLabel`.
- All actual time fields use timestamps.
- Public content moves to the API; `favoriteSongIds`, `userProfileCache`, and `tourGuideChecklist` stay in local storage.
- The server is brought online with empty tables first; no mock data is imported into D1 during this implementation phase.

## Target Endpoints

- `GET /health`
- `GET /home`
- `GET /albums`
- `GET /albums/:id`
- `GET /albums/:id/songs`
- `GET /songs/:id`
- `GET /performances`
- `GET /documentaries`
- `GET /eras/:id`
- `GET /tours`
- `GET /tours/:id`
- `GET /tours/:id/shows`
- `GET /shows/:id`
- `GET /shows/:id/videos`

## Target Database Schema

### `albums`

- `id`
- `name`
- `year`
- `cover`
- `announcement_at`
- `release_at`

Purpose:
- Album list/detail
- Song relation by `album_id`
- Home spotlight derivation for album preview / release-week cards

### `news_items`

- `id`
- `title`
- `summary`
- `published_at`
- `tag`
- `route_type`
- `route_path`
- `route_query`

Purpose:
- Home “最近动态”

### `songs`

- `id`
- `name`
- `album_id`
- `lyrics_json`
- `mv_json`

Purpose:
- Album song list
- Song detail

### `performances`

- `id`
- `title`
- `subtitle`
- `cover`
- `year`
- `domain`

Purpose:
- Library Live list

### `documentaries`

- `id`
- `title`
- `summary`
- `cover`
- `release_at`

Purpose:
- Library documentary list

### `eras`

- `id`
- `album_id`
- `name`
- `cover`
- `theme_color`
- `tagline`
- `hero_intro`
- `signature_looks_json`
- `milestones_json`
- `era_honors_json`
- `revisit_json`

Purpose:
- Home era cards use `id/name/cover/theme_color/tagline`
- Era detail uses the full record

### `tours`

- `id`
- `name`
- `year`
- `status`
- `cover`
- `description`
- `announcement_at`
- `start_at`
- `end_at`
- `setlists_json`

Purpose:
- Tour index and detail
- Home spotlight derivation for tour preview / ongoing cards

### `shows`

- `id`
- `tour_id`
- `country`
- `city`
- `venue`
- `start_at`
- `status`
- `surprise_guests_json`
- `surprise_songs_json`
- `ticket_platform`
- `sale_at`
- `entry_time`
- `address`
- `seat_map_images_json`
- `notes_json`

Purpose:
- Tour detail grouped show list
- Show detail ticketing / venue info

### `videos`

- `id`
- `show_id`
- `cover`
- `title`
- `song`
- `user_name`
- `uploaded_at`

Purpose:
- Show detail video list

## API Response Strategy

### `GET /home`

Returns:
- `spotlights`
- `eras`
- `news`

Important:
- `spotlights` are derived on the server from current `albums` + `tours` using the same date-window rules now implemented in [utils/homeSelectors.ts](/Users/bytedance/projects/swiftie-mini/utils/homeSelectors.ts), but rewritten to compare timestamps instead of date strings
- `eras` are projected from the `eras` table, not stored twice

### `GET /shows/:id`

Returns one assembled show detail object, including:
- core show fields
- ticketing / venue fields now stored on `shows`

This avoids a second “guide” fetch and removes the need for `show_guides`.

## Frontend Runtime Structure

### Keep

- [utils/storage.ts](/Users/bytedance/projects/swiftie-mini/utils/storage.ts)
- selector-based page data shaping
- current routes and route params

### Add

- `services/request.ts`
  Wrap `wx.request`, normalize timeout / HTTP errors
- `services/contentApi.ts`
  Export page-sized API calls
- `services/contentStore.ts`
  Small in-memory per-endpoint cache only
- shared page error-state helper or shared error-state data shape

### Remove from UI

- [pages/tour/detail/index.wxml](/Users/bytedance/projects/swiftie-mini/pages/tour/detail/index.wxml) hero `rangeLabel`
- [pages/era/detail/index.wxml](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.wxml) hero `yearLabel`
- [pages/era/detail/index.wxml](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.wxml) milestone `dateLabel`

### Remove from runtime path

- direct page imports of `data/*.ts`
- mock fallback after request failure

## Page-by-Page Fetch Plan

### Home

Files:
- [pages/home/index.ts](/Users/bytedance/projects/swiftie-mini/pages/home/index.ts)
- [pages/home/index.wxml](/Users/bytedance/projects/swiftie-mini/pages/home/index.wxml)

Behavior:
- request `GET /home`
- keep `getHomeSpotlightDisplay()` if the API returns `HomeSpotlight`
- render `loading` / `error` / `ready`
- no date-label strings in the API payload

### Library Index

Files:
- [pages/library/index.ts](/Users/bytedance/projects/swiftie-mini/pages/library/index.ts)

Behavior:
- no request
- keep as static navigation

### Album List / Detail

Files:
- [pages/album/index.ts](/Users/bytedance/projects/swiftie-mini/pages/album/index.ts)

Behavior:
- no `id`: `GET /albums`
- with `id`: `GET /albums/:id` and `GET /albums/:id/songs`

### Song Detail

Files:
- [pages/song/index.ts](/Users/bytedance/projects/swiftie-mini/pages/song/index.ts)

Behavior:
- `GET /songs/:id`
- favorites still use local storage

### Performance / Documentary

Files:
- [pages/performance/index.ts](/Users/bytedance/projects/swiftie-mini/pages/performance/index.ts)
- [pages/documentary/index.ts](/Users/bytedance/projects/swiftie-mini/pages/documentary/index.ts)

Behavior:
- `GET /performances`
- `GET /documentaries`

### Era Detail

Files:
- [pages/era/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/era/detail/index.ts)

Behavior:
- `GET /eras/:id`
- remove the hero eyebrow that currently renders `exhibit.hero.yearLabel`
- remove the timeline date row that currently renders `item.dateLabel`

### Tour Index / Detail / Show Detail

Files:
- [pages/tour/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/index.ts)
- [pages/tour/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/tour/detail/index.ts)
- [pages/show/detail/index.ts](/Users/bytedance/projects/swiftie-mini/pages/show/detail/index.ts)

Behavior:
- tour index: `GET /tours`
- tour detail: `GET /tours/:id` + `GET /tours/:id/shows`
- show detail: `GET /shows/:id` + `GET /shows/:id/videos`
- remove the hero meta line that currently renders `tour.rangeLabel`

## Selector Refactor Strategy

Do **not** introduce a global `ContentSnapshot` runtime model.

Instead:
- `homeSelectors` consume home-sized inputs
- `librarySelectors` consume album / performance / documentary inputs
- `eraSelectors` consume era detail payloads
- `tour` selectors consume `tour` + `shows` + `videos`

Goal:
- selectors stay pure
- page requests stay lazy
- no page downloads unrelated data

## Shared Error UI Contract

Every remote page uses the same state shape:

```ts
interface RemotePageState {
  loading: boolean;
  loadError: boolean;
}
```

Every remote page renders the same branch:

```xml
<view wx:if="{{loading}}" class="card">加载中...</view>
<view wx:elif="{{loadError}}" class="card">
  <text>内容加载失败，请稍后重试</text>
  <button bindtap="retryLoad">重新加载</button>
</view>
<block wx:else>
  <!-- page content -->
</block>
```

## File Structure To Implement

- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/wrangler.jsonc`
- Create: `server/migrations/0001_initial.sql`
- Create: `server/src/index.ts`
- Create: `server/src/types.ts`
- Create: `server/src/lib/json.ts`
- Create: `server/src/lib/queries.ts`
- Create: `types/api.ts`
- Create: `services/request.ts`
- Create: `services/contentApi.ts`
- Create: `services/contentStore.ts`
- Modify: `types/home.ts`
  Keep existing spotlight types if the API returns the same contract
- Modify: `types/tour.ts`
  Remove `ShowGuide` if show detail fields move into `Show`; remove `rangeLabel`
- Modify: `types/era.ts`
  Remove `yearLabel` and `dateLabel`
- Modify: `utils/homeSelectors.ts`
  Split out spotlight derivation helpers so they can be reused server-side or mirrored exactly there; switch date comparison from string values to timestamps
- Modify: `utils/selectors.ts`
  Stop reading runtime mock modules directly
- Modify: `utils/librarySelectors.ts`
- Modify: `utils/eraSelectors.ts`
- Modify: `pages/home/index.ts`
- Modify: `pages/home/index.wxml`
- Modify: `pages/album/index.ts`
- Modify: `pages/song/index.ts`
- Modify: `pages/performance/index.ts`
- Modify: `pages/documentary/index.ts`
- Modify: `pages/era/detail/index.ts`
- Modify: `pages/era/detail/index.wxml`
- Modify: `pages/tour/index.ts`
- Modify: `pages/tour/detail/index.ts`
- Modify: `pages/tour/detail/index.wxml`
- Modify: `pages/show/detail/index.ts`
- Modify: `tests/home-module.test.ts`
- Modify: `tests/library-module.test.ts`
- Modify: `tests/era-module.test.ts`
- Modify: `tests/tour-module.test.ts`
- Modify: `docs/data.md`
- Modify: `docs/api.md`
- Modify: `docs/architecture.md`

## Implementation Order

### Task 1: Refactor Domain Types And Selectors For API Inputs

- [ ] Write failing tests proving selectors can consume page-sized inputs instead of importing runtime mocks directly.
- [ ] Remove `ShowGuide` from the runtime domain if its fields move into `Show`.
- [ ] Remove `rangeLabel`, `yearLabel`, and `dateLabel` from domain types and test fixtures.
- [ ] Refactor `homeSelectors` so spotlight derivation is based on `albums + tours + news + eras` inputs.
- [ ] Rewrite home spotlight date-window logic to use timestamps instead of string date comparison.
- [ ] Refactor library / era / tour selectors to accept data arguments.
- [ ] Run `npm run test:home`, `npm run test:library`, `npm run test:era`, `npm run test:tour`, `npm run typecheck`.
- [ ] Commit the selector boundary refactor.

### Task 2: Create `server/` Worker And D1 Schema

- [ ] Write a failing smoke test for `GET /health`.
- [ ] Create Worker config, TypeScript config, and Wrangler bindings.
- [ ] Create the D1 migration with the final table set:
  `albums`, `news_items`, `songs`, `performances`, `documentaries`, `eras`, `tours`, `shows`, `videos`.
- [ ] Store all actual time fields as integer timestamps in D1.
- [ ] Verify `npx tsx --test server/tests/worker.test.ts` still fails only because the router is not implemented.
- [ ] Commit the server scaffold and schema.

### Task 3: Implement Empty-State API Contracts First

- [ ] Define response contracts so every endpoint can return valid empty data before real content is entered.
- [ ] Ensure list endpoints return empty arrays instead of errors when tables are empty.
- [ ] Ensure detail endpoints return `null` for missing records rather than failing at the route layer.
- [ ] Ensure `GET /home` returns `{ spotlights: [], eras: [], news: [] }` when there is no content.
- [ ] Verify the Worker and mini-program can complete requests successfully against an empty database.
- [ ] Commit the empty-state API contract.

### Task 4: Implement Read Endpoints

- [ ] Write failing Worker tests for `GET /home`, `GET /albums/:id`, and `GET /tours/:id/shows`.
- [ ] Implement query helpers and route handlers for all target endpoints.
- [ ] Ensure `GET /home` derives spotlight cards with the same window logic as the current app using timestamp comparisons.
- [ ] Ensure `GET /shows/:id` returns ticketing / venue fields from `shows`.
- [ ] Ensure responses do not expose removed label fields.
- [ ] Ensure all endpoints remain valid and stable when D1 contains zero rows.
- [ ] Run `npx tsx --test server/tests/worker.test.ts` and `cd /Users/bytedance/projects/swiftie-mini/server && npm run typecheck`.
- [ ] Commit the API routes.

### Task 5: Add Frontend Request Layer And Shared Error UI

- [ ] Write failing tests for `services/request.ts` and `services/contentApi.ts`.
- [ ] Implement `services/request.ts`, `services/contentApi.ts`, and a small per-endpoint `services/contentStore.ts`.
- [ ] Remove runtime mock fallback from the request path.
- [ ] Normalize timestamp fields into page-ready display strings only inside the page layer or view-model helpers, not in API contracts.
- [ ] Add shared page `loading` / `loadError` handling.
- [ ] Distinguish empty success from failure: empty arrays / `null` render empty states, request errors render the shared failure UI.
- [ ] Run `npm run typecheck` and the affected test suites.
- [ ] Commit the frontend request layer.

### Task 6: Migrate Pages In Low-Risk Order

- [ ] Migrate home page to `GET /home`.
- [ ] Migrate album list/detail and song detail.
- [ ] Migrate performance and documentary pages.
- [ ] Migrate era detail.
- [ ] Migrate tour index, tour detail, and show detail.
- [ ] Remove the current UI elements bound to `rangeLabel`, `yearLabel`, and `dateLabel`.
- [ ] After each page batch, verify the corresponding tests and manual flow.
- [ ] Commit each page batch separately.

### Task 7: Docs, Deployment, And Final Verification

- [ ] Update [docs/data.md](/Users/bytedance/projects/swiftie-mini/docs/data.md) with the new server data sources.
- [ ] Update [docs/api.md](/Users/bytedance/projects/swiftie-mini/docs/api.md) with the final endpoint contracts.
- [ ] Update [docs/architecture.md](/Users/bytedance/projects/swiftie-mini/docs/architecture.md) with `server/`, `services/request.ts`, and the shared error-state flow.
- [ ] Add deployment steps to `server/README.md`.
- [ ] Document that real content is entered later in a separate data-entry phase after the empty API is verified end-to-end.
- [ ] Verify Worker deploy URL is added to the mini-program legal request domain list.
- [ ] Run:
  `npx tsx --test server/tests/worker.test.ts`
  `npm run test:home`
  `npm run test:library`
  `npm run test:era`
  `npm run test:tour`
  `npm run typecheck`
- [ ] Commit docs and rollout verification.

## Manual Acceptance Checklist

- Home can request `GET /home` successfully even when the database is empty.
- Library index makes no request.
- Album list/detail and song detail can request remote APIs successfully with empty results.
- Performance and documentary lists can request remote APIs successfully with empty results.
- Era detail can request `GET /eras/:id` successfully and handle `null`.
- Tour index, tour detail, and show detail can request remote APIs successfully with empty results.
- Show detail still displays ticketing / venue information after `show_guides` removal.
- Tour detail no longer renders `rangeLabel`.
- Era detail no longer renders `yearLabel` or `dateLabel`.
- Favorites, profile cache, and guide checklist still persist locally.
- Any remote request failure shows the shared failure UI instead of mock content.
