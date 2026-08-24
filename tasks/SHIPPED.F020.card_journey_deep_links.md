# F020 – Card and in-page deep links via `buildJourneyUrl`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F019_adopt_page_frame`  
**Description**: Compose Discovery card and in-page deep links with spa_utils `buildJourneyUrl`, `resolveAlbOrigin`, and `JOURNEY_APP_PATHS` so Customer / Admin / Mentor / Mentee detail views open through welcome/ALB prefixes — never Vite/debug ports.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Cross-SPA URLs (welcome nginx / ALB)** (`buildJourneyUrl`, `resolveAlbOrigin`, `JOURNEY_APP_PATHS`)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/components/DiscoveryCard.vue` — click opens `card.link`
- `src/pages/**` / `src/composables/useCards.ts` — list pages
- `src/api/types.ts` — `Card.link`

Origin rules (already implemented in spa_utils): welcome **:8080**, or current origin when the port is **8080** / **80** / **443** / empty. On Vite/debug ports (`8398`, `8397`, `8388`, `8392`, `8394`, …) `resolveAlbOrigin()` rewrites to `{protocol}//{hostname}:8080`. **Never** emit hrefs to those debug ports.

Discovery remains the only CardGrid list host. Other SPAs own detail/edit/create pages.

## Goals

- Import `buildJourneyUrl`, `resolveAlbOrigin`, and `JOURNEY_APP_PATHS` from `@mentor-forge/mentorhub_spa_utils` (package root).
- When Discovery **composes** a cross-SPA detail URL (member/mentee/customer/admin/mentor/mentee profile or settings, etc.), use `buildJourneyUrl(journey, path)` / `JOURNEY_APP_PATHS`. Do not concatenate `:8398` (or other debug ports) into hrefs.
- If `card.link` is already an absolute `http(s)` URI to an **external** learning resource, keep it (do not force it through `:8080`).
- If `card.link` is missing, a relative journey path, or a debug-port URL, replace/compose with `buildJourneyUrl` so the click target is welcome/ALB.
- In-page links that leave Discovery (profile avatar is already PageFrame; any extra “open in Customer SPA” controls) use the same helpers.
- Unit tests: with `window.location` at `http://127.0.0.1:8398/...`, composed hrefs include **`:8080`** and `/customer/`, `/admin/`, `/mentor/`, or `/mentee/` as appropriate — not `:8398` / `:8388` / `:8392` / `:8394`.
- README: card deep links use `buildJourneyUrl`; list dashboards stay on Discovery.

Do not change PageFrame props or re-add a local drawer.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — appearance/card/composable tests cover composed hrefs (debug port → `:8080`)
- `npm run lint`
- `npm run build`

Cypress href assertions on `:8080` are required in **F021**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/components/DiscoveryCard.vue` and/or list pages/composables that set `href` / click targets
- `src/components/DiscoveryCard.test.ts` (and any new helper test, e.g. `src/utils/cardHref.ts`)
- `README.md` — cross-SPA card links

Do not add new Vue list routes. Do not link to debug ports.

## Execution Notes

- Plan: centralize card click-target resolution in a small utility that preserves external
  absolute HTTP(S) resources, normalizes relative/debug-port journey links through
  spa_utils, and supplies owning-journey fallbacks from card type/path metadata.
- Update `DiscoveryCard` to use the resolved href for clickability and navigation, add
  focused unit coverage for Customer/Admin/Mentor/Mentee targets from a `:8398`
  location, and document that Discovery remains the list host.
- Run `npm run test`, `npm run lint`, and `npm run build`.
- Implemented `src/utils/cardHref.ts`: explicit journey prefixes and route-shaped links
  are mapped to their owning SPA, type-based fallbacks provide detail targets when
  `card.link` is absent, known/same-host debug-port URLs are rebuilt through the
  welcome origin, and external absolute HTTP(S) resources are returned unchanged.
- `DiscoveryCard` now bases clickability and `_self` navigation on the composed href.
  README documents ALB composition and Discovery's list-dashboard ownership.
- Verification:
  - `npm run test` — passed (10 files, 60 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed. Vite reported the existing runtime-config script and
    large-chunk advisory warnings; neither failed the build.
- Orchestrator confirmation: `npm run test` (60 passed), `npm run lint`, and `npm run build` passed. From `:8398`, composed hrefs use `:8080` journey prefixes; external HTTP(S) links stay unchanged.
