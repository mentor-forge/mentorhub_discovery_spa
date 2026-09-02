# F030 – Localize CardGrid layout (equal-height rows, fill-width columns)

**Status**: Shipped
**Type**: Feature
**Depends On**: `F029_config_events_catalog_e2e`
**Description**: Implement CardGrid layout **in this SPA** and stop importing `CardGrid` from spa_utils (Discovery is the only journey SPA that hosts card dashboards; the shared package will drop it). Make every card in a row match the tallest card, and make 3–7 column tracks fill available width the same way 1–2 columns already do.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — current `CardGrid` / `MhCard` contract (flatten slot, `automationId`, equal-width CSS Grid, expanded stretch vs collapsed intrinsic). **Keep importing `MhCard` from spa_utils.** The local grid is an explicit exception to “reuse spa_utils layout” because this SPA is the only CardGrid host.
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/DiscoveryHomePage.vue` — `import { CardGrid, ListPageSearch } from '@mentor-forge/mentorhub_spa_utils'` and `v-container` wrapping the grid
- `src/components/DiscoveryCard.vue` — outer `.discovery-card` wrapper around `MhCard` (likely why packaged stretch rules do not fill the row)
- `../mentorhub_spa_utils/src/components/CardGrid.vue` — starting implementation to copy and then fix locally (allowed sibling: spa_utils)

**Layout defects to fix (local CSS, not a spa_utils patch):**

1. **Equal row height:** every expanded card in a visual row is as tall as the tallest card in that row. Collapsed `MhCard` (if used) stays intrinsic. The local `DiscoveryCard` wrapper must participate in stretch (`height: 100%` / flex column) so `MhCard` can fill the grid item.
2. **Fill width:** cards expand to fill their grid track. Column counts 3, 4, 5, 6, and 7 must use the same `minmax(0, 1fr)` fill behavior as 1- and 2-column layouts (no leftover empty track, no card `max-width` that keeps a 3+ column card as narrow as a 1–2 column card). Use a fluid/wide page container so the grid actually receives the width those breakpoints need; a default Vuetify `v-container` max-width that caps the grid at two-card width is a failure mode.

Keep the existing `automationId` → `data-automation-id` on the grid root so Cypress `discovery-{source}-grid` ids stay stable. Keep ListPageSearch from spa_utils.

**Out of scope**: Icon padding / type hover (F031). Notification Cancel (F032). Home auto-follow (F033). Cypress viewport matrix (F034). Do not publish spa_utils from this repo. Do not edit `mentorhub_spa_utils` sources except as read-only context.

## Goals

- A local `src/components/CardGrid.vue` (name may match) owns the CSS Grid: equal-width tracks, 16px gap, responsive 1→8 columns at the same breakpoints as the former package grid (0 / 600 / 960 / 1280 / 1600 / 1920 / 2240 / 2560, cap 8), slot flatten / key preservation / skip null-comment-text.
- `DiscoveryHomePage.vue` (and any other CardGrid import) uses the **local** component. Grep must show no `CardGrid` import from `@mentor-forge/mentorhub_spa_utils`.
- Expanded cards in a row share the row’s height. Each card’s used width is 100% of its track at every column count, including 3–7.
- Unit tests cover flatten/keys/`automationId` and the CSS contract (track fill + expanded stretch). Co-locate `src/components/CardGrid.test.ts`.
- README: CardGrid layout is **local** to Discovery; spa_utils still owns `MhCard`, `PageFrame`, and ListPageSearch.

### Craftsmanship Expectations

- This is a **local extraction**, not a harvest into spa_utils and not a thin re-export of the package component.
- Keep `MhCard` in spa_utils; do not duplicate card chrome.
- Delete the spa_utils `CardGrid` import rather than leaving both implementations wired.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — new CardGrid unit tests; existing DiscoveryCard / useCards tests still pass
- `npm run lint`
- `npm run build`

Headless Cypress equal-height / wide-viewport checks are F034. Do not skip unit coverage of the CSS contract (read the SFC source or computed styles in Vitest the way spa_utils `CardGrid.test.ts` does).

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `src/components/CardGrid.vue`
- `src/components/CardGrid.test.ts`

**Update:**

- `src/pages/DiscoveryHomePage.vue` — local CardGrid; fluid/full-width container as needed
- `src/components/DiscoveryCard.vue` — stretch/fill so the card fills the grid item (no icon/hover work here)
- `src/components/DiscoveryCard.test.ts` — only if the wrapper markup change requires it
- `README.md` — local CardGrid ownership
- `vitest.config.ts` — only if new component coverage paths are required

Do not change notification actions, appearance icons, or home auto-follow. Do not change the spa_utils pin.

## Execution Notes

- Plan: copy the spa_utils CardGrid implementation into this SPA, retain its slot
  flattening/key/automation contract, and keep the fixed 1–8 `minmax(0, 1fr)`
  breakpoints.
- Make the page container fluid and make both the generated grid item and local
  `DiscoveryCard` wrapper full-height flex columns so expanded `MhCard` roots fill
  each equal-height CSS Grid row while collapsed cards retain intrinsic height.
- Add local component tests for structure and the CSS contract, update ownership
  documentation, then run `npm run test`, `npm run lint`, and `npm run build`.
- Implemented local `CardGrid` slot flattening and fixed responsive CSS Grid
  tracks from one through eight columns. Every track uses `minmax(0, 1fr)`, grid
  items fill their tracks, expanded `.mh-card` descendants stretch, and collapsed
  cards retain intrinsic height.
- Updated `DiscoveryHomePage` to use the local component inside a fluid
  `v-container`. Updated the local `DiscoveryCard` wrapper to be a full-width,
  full-height flex column so packaged `MhCard` chrome can fill equal-height rows.
- Added unit coverage for flattening, meaningful-node filtering, VNode keys,
  `automationId`, all responsive fill-width rules, the fluid page container, and
  the expanded/collapsed stretch contract.
- Verification:
  - `npm run test` — passed (12 files, 90 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed; existing Vite runtime-config script and chunk-size
    warnings remain non-fatal.
  - Confirmed no `CardGrid` import remains from
    `@mentor-forge/mentorhub_spa_utils`.
- Implementation is complete and awaiting the orchestrator's commit; task status
  remains Running because the execution agent was instructed not to commit or
  rename the task file.
