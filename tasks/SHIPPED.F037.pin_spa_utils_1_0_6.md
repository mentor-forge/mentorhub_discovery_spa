# F037 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.6` (CardGrid removal, DataCardGrid, MarkdownEditor)

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Discovery SPA **1.0.6 pin**. Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.5` to exact **`1.0.6`**, refresh the lockfile from CodeArtifact, and align this SPA with the shipped 1.0.6 card and markdown contract. Package `CardGrid` is removed. Keep Discovery’s **local** list `CardGrid` and local card-body `MarkdownView`. Do not move the list grid into spa_utils. Do not adopt package `DataCardGrid` for collection dashboards. Cypress and packaging are **F038**.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.6**; **MhCard / DataCard / DataCardGrid**; **Type-aligned editors** (`markdown` / `MarkdownEditor`). Shared list `CardGrid` left the package in 1.0.6. List card dashboards belong to Discovery. `DataCardGrid` is a no-prop CSS Grid slot wrapper (`class="data-card-grid"`, hardcoded `data-automation-id="data-card-grid"`): 1 column below 641px, 2 from 641px, 4 from 1920px, 16px gap. It is not a Fragment flattener and not a list dashboard. `MarkdownEditor` props are unchanged (`field`, `modelValue`, `onSave`, `editable`, `visible`, `automationId`, `label`, `hint`, `rules`, `rows`). Resting view is sanitized GFM HTML (`marked` + `dompurify` bundled in spa_utils). Editable fields enter the textarea on click or Enter. Automation ids: root `automationId`, textarea `${automationId}-input`, display `${automationId}-display` (no double `-display` suffix when the prop already ends in `-display`), value `markdown-field-display`. Package-root import pulls component CSS.
- `README.md` — currently documents spa_utils **1.0.5** (ownership table, PageFrame, Token tab, Testing, Automation Support) and states that Discovery owns the local responsive `CardGrid`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.5"`; also exact `marked@18.0.10` and `dompurify@3.4.14` used only by local `MarkdownView`
- `src/components/CardGrid.vue` — **local** list layout (Fragment/`v-for` flattener, `automationId` prop such as `discovery-${source}-grid`). Import site is `src/pages/DiscoveryHomePage.vue` via `@/components/CardGrid.vue`. This is not the removed package export.
- `src/components/CardGrid.test.ts` — unit coverage of the local grid; keep
- `src/pages/DiscoveryHomePage.vue` — shared list page for home, events, members, resources, paths, plans, products, notifications. Uses local `CardGrid` + `DiscoveryCard` + spa_utils `ListPageSearch`
- `src/components/DiscoveryCard.vue` — spa_utils `MhCard` chrome; body is local `MarkdownView`, not `MarkdownEditor`
- `src/components/MarkdownView.vue` / `src/components/MarkdownView.test.ts` — local sanitized markdown for list-card bodies. This is why `marked` and `dompurify` are already direct dependencies. Do not replace this with `MarkdownEditor`.
- `src/pages/NotificationViewPage.vue` — single placeholder `MhCard`. Not a multi-card view/edit page.
- `src/App.vue` — `PageFrame` with `page-title="Discovery"` plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils and passes `GET /discovery/api/config`
- `src/main.ts` — no spa_utils stylesheet import; root imports in other modules already pull package CSS for Vite
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.6 changes the inline setting
- `cypress.config.ts` / `cypress/support/e2e.ts` — spa_utils Cypress subpaths `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands`

**Source issue**: first `mentorhub_discovery_spa` issue in the spa_utils **1.0.6** wave. This task delivers **the pin and local source/doc alignment**. Cypress markdown interaction and packaging are **F038**.

**External prerequisite**: `mentorhub_spa_utils` F050–F056 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.6` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/discovery/`, the catalog, `/discovery/config` Settings host, and local CardGrid dashboards are already shipped (F014–F036). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.6** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F037.pin_spa_utils_1_0_6.md`, and stop — do not stay on `1.0.5` and do not point `package.json` at a git URL or sibling path.

This SPA **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos. Do not push the local list grid back into `mentorhub_spa_utils`.

**Survey (planning time — reconfirm, do not assume a later edit added imports):**

- Zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils`. The only `CardGrid` is local (`@/components/CardGrid.vue`), used by the eight collection dashboards.
- Zero imports of `DataCard`, `DataCardGrid`, or `MarkdownEditor`. There is no local copy of those three to delete.
- `NotificationViewPage` is one `MhCard`, not several edit/detail cards. Do not wrap it in `DataCardGrid`.
- List-card bodies render through local `MarkdownView` (`marked` + `dompurify` already in `package.json`). Cypress `cards.cy.ts` asserts that HTML (`h2` / `strong` inside `discovery-card-…-body-display`). Those specs do not type into a markdown textarea. Leave them for F038.
- Search `.type` calls in `cards.cy.ts` target `ListPageSearch` inputs (`discovery-resources-search`, `discovery-notifications-search`), not `MarkdownEditor`.

**Out of scope**: Cypress specs (F038). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not fork `AdminPage`, `TokenClaimsCard`, or `PageFrame`. Do not add, rename, or delete list routes, `/notification/:id`, or `/config`. Do not convert `DiscoveryCard` bodies from `MarkdownView` to `MarkdownEditor`. Do not delete `marked` or `dompurify` — they still belong to local card-body rendering, and they must not be re-added as a way to render package `MarkdownEditor` (the package already bundles them).

### Wave ordering

Pin + local 1.0.6 alignment (F037) → Cypress confirmation and packaging (F038). Pinning first makes 1.0.6 `MarkdownEditor` resting view and `DataCardGrid` available before F038 checks selectors.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.6"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.6` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.6`.
- Do **not** add `marked`, `dompurify`, or any other markdown renderer. The existing exact `marked@18.0.10` and `dompurify@3.4.14` entries stay, and their only SPA import remains `src/components/MarkdownView.vue`. Do not bump them as part of the pin.
- There are zero imports of `CardGrid` from `@mentor-forge/mentorhub_spa_utils`. If a later edit added one, delete that import. Do not replace the local list grid with package `DataCardGrid`, and do not delete `src/components/CardGrid.vue`.
- Home, events, members, resources, paths, plans, products, and notifications stay on the local list `CardGrid` (`discovery-${source}-grid`) plus `DiscoveryCard` / `MhCard`. Search by Name, role-gated Invite/New, notification Dismiss/Cancel, and Home single-card auto-follow stay as they are.
- Do not add a local multi-card view/edit page just to consume `DataCardGrid`. This SPA has no page that lays out several edit/detail cards. `/discovery/config` continues to render packaged `AdminPage`. `/notification/:id` stays a single placeholder `MhCard`. If implementation discovers a local page that already lays out several edit/detail cards with ad-hoc markup, replace that layout with package `DataCardGrid` + `DataCard` (no props on the grid; children authored in the slot; root class `data-card-grid`; hardcoded `data-automation-id="data-card-grid"`). Do not pass breakpoint props. Do not flatten Fragments. Do not use it as a list dashboard.
- Do not add a `MarkdownEditor` consumer for list-card bodies. Card descriptions stay on local `MarkdownView`. If a compile fix must touch an editor import that already exists, keep the same props (`field`, `modelValue`, `onSave`, `editable`, `visible`, `automationId`, `label`, `hint`, `rules`, `rows`). Package `MarkdownEditor` resting view is sanitized rendered markdown; do not reimplement that in this repo, and do not install extra sanitizer packages for it.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Discovery"`). Keep `provideEditorConfig`. IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils.
- `README.md` names the pinned version **1.0.6** wherever it currently says 1.0.5 (architecture table, install note, layout chrome, Testing, Automation Support). Keep existing `/discovery/config` Settings wording and the Token / chrome `display_name` facts, updated to say they are owned by spa_utils **1.0.6**. State that package `CardGrid` is gone, this SPA keeps its local list grid and does not publish that grid back to spa_utils, multi-card edit/detail would use package `DataCardGrid` / `DataCard` (this SPA has none; list dashboards must not), list-card bodies stay local `MarkdownView`, and package `MarkdownEditor` resting view is owned by spa_utils (this SPA does not import `MarkdownEditor`, and it does not add `marked` / `dompurify` for that editor).
- Fix any `src/**` import or type breakage from 1.0.6. Do not add, rename, or delete routes. Keep the existing `AdminPage` wrapper and local CardGrid pages.
- `vitest.config.ts` may be touched **only** if 1.0.6 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.6. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite Cypress specs here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: multi-card edit/detail layout and field-editor markdown are owned by 1.0.6 `DataCard` / `DataCardGrid` / `MarkdownEditor`. The list dashboard and its card-body renderer stay here because Discovery is the only host.
- Keep journey-specific behavior in this SPA (local `CardGrid`, `DiscoveryCard`, `MarkdownView`, Search by Name, Invite/New, notification Dismiss/Cancel, Home auto-follow).
- Prefer keeping the local list grid over importing a package substitute. Do not invent a `DataCardGrid` list page because package `CardGrid` disappeared.
- Do not introduce local workarounds that reimplement `DataCardGrid` columns, and do not sanitize package `MarkdownEditor` output in this repo.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.6**
- Confirmation searches:
  - `rg "CardGrid" src` — hits are only `@/components/CardGrid.vue` and its tests / `DiscoveryHomePage.vue`. Zero `CardGrid` named imports from `@mentor-forge/mentorhub_spa_utils`
  - `rg 'DataCardGrid|DataCard[^G]|MarkdownEditor' src` — zero, unless a pre-existing multi-card edit/detail page was migrated in this task
  - `rg "from 'marked'|from 'dompurify'|from \"marked\"|from \"dompurify\"" src` — only `src/components/MarkdownView.vue`
  - `rg 'marked|dompurify' package.json` — the pre-existing exact pins only; no new markdown packages
  - `rg "from '@mentor-forge/mentorhub_spa_utils'" src cypress.config.ts cypress/support` — every import still resolves
- `npm run lint` — `vue-tsc --noEmit` must be clean
- `npm run test` — full Vitest suite, including `CardGrid.test.ts` and `MarkdownView.test.ts`
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold
- `npm run build` — `vue-tsc` + Vite production build must be clean

Do **not** run `npm run cypress:run` in this task. Leave selector checks and packaging to F038. Do not “fix” Cypress here unless a Cypress helper import fails to compile.

Packaging (`npm run container` / `npm run service`) is **F038**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`; do not add `marked` or `dompurify`; leave the existing exact pins
- `package-lock.json` — resolved 1.0.6 from CodeArtifact
- `README.md` — spa_utils version note **1.0.6**; package `CardGrid` removed; local list grid stays (home, events, members, resources, paths, plans, products, notifications) and is not harvested into spa_utils; `DataCardGrid` / `DataCard` contract for multi-card edit/detail (none in this SPA); list-card bodies stay `MarkdownView`; package `MarkdownEditor` resting view owned by spa_utils; keep existing `/discovery/config` wording and Token / chrome `display_name` ids

**Update only if 1.0.6 breaks compile or a package `CardGrid` import is found:**

- Any `src/**` file that imported `CardGrid` from `@mentor-forge/mentorhub_spa_utils` — delete that import. Keep `@/components/CardGrid.vue`
- Any local page that already lays out several edit/detail cards — switch that layout to package `DataCardGrid` + `DataCard`
- `vitest.config.ts` — only if 1.0.6 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.6
- Any other `src/**` import or type that fails to compile against 1.0.6

Do not change list routes, `/notification/:id`, or `/config`. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`. Do not replace `MarkdownView` with `MarkdownEditor`. Do not delete `src/components/CardGrid.vue`. Do not edit `mentorhub_spa_utils`. Do not add `src/main.ts` stylesheet import unless the production build proves package CSS is missing.

## Execution Notes

### Plan (2026-09-29)
- Prerequisite: `mh` then `npm view` → **1.0.6** published on CodeArtifact. Proceed.
- Bump `package.json` exact pin `"@mentor-forge/mentorhub_spa_utils": "1.0.6"`; leave `marked` / `dompurify` pins unchanged.
- `mh` + `npm install --include=dev` to refresh lockfile from CodeArtifact.
- Update `README.md`: replace all spa_utils **1.0.5** mentions with **1.0.6**; document package `CardGrid` removal, local list grid retention, `DataCardGrid`/`DataCard` for multi-card edit/detail (none here), local `MarkdownView` for list-card bodies, package `MarkdownEditor` resting view owned by spa_utils (not imported here).
- No `src/**` migration expected (survey: zero package `CardGrid` / `DataCardGrid` / `DataCard` / `MarkdownEditor` imports; local CardGrid + MarkdownView stay). Touch `vitest.config.ts` / Cypress helper imports only if 1.0.6 breaks compile.
- Run Testing Expectations; leave Status Pending for orchestrator.

### Summary (2026-09-29)
Pinned `@mentor-forge/mentorhub_spa_utils` to exact **1.0.6** and refreshed the lockfile from CodeArtifact. README aligned to 1.0.6 (package `CardGrid` gone; local list grid + `MarkdownView` retained; `DataCardGrid`/`DataCard`/`MarkdownEditor` documented as package-owned and unused here). No `src/**`, `vitest.config.ts`, or Cypress helper changes required.

### Test results
- `npm view @mentor-forge/mentorhub_spa_utils version` → `1.0.6`
- `npm ls @mentor-forge/mentorhub_spa_utils` → `@mentor-forge/mentorhub_spa_utils@1.0.6`
- Confirmation searches:
  - `CardGrid` in `src`: local only (`CardGrid.vue`, `CardGrid.test.ts`, `DiscoveryHomePage.vue` via `@/components/CardGrid.vue`)
  - `DataCardGrid|DataCard|MarkdownEditor` in `src`: **zero** hits
  - `marked`/`dompurify` imports in `src`: only `MarkdownView.vue`
  - `package.json` marked/dompurify: exact `18.0.10` / `3.4.14` only
  - spa_utils imports in `src` + Cypress helpers: resolve (including `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands`)
- `npm run lint` — **pass** (`vue-tsc --noEmit` clean)
- `npm run test` — **pass** (14 files, 125 tests)
- `npm run test:coverage` — **pass**; thresholds held (`src/api` 98%/100%/84%, `src/composables` 98%/91%/74%, `src/components` 100%/100%/97%)
- `npm run build` — **pass** (`vue-tsc` + Vite production build)
- Cypress / packaging left for F038

Orchestrator reconfirmed `npm ls` 1.0.6, the same searches, `npm run lint`, `npm run test` (125), `npm run test:coverage`, and `npm run build`. Status set to **Shipped**.

