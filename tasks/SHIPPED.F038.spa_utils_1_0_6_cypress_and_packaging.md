# F038 – 1.0.6 Cypress confirmation and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F037_pin_spa_utils_1_0_6`  
**Description**: Confirm Cypress still matches spa_utils **1.0.6** `MarkdownEditor` resting view and the local list `CardGrid`, and run the packaged SPA as the acceptance gate for the Discovery 1.0.6 pin. List dashboards stay local. Do not invent an editable markdown field or a `DataCardGrid` page. Do not change the pin.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — `MarkdownEditor` resting view is sanitized rendered markdown. Editable fields enter the textarea on click or Enter. Textarea automation id is `${automationId}-input`; display is `${automationId}-display` (no double `-display` suffix when the prop already ends in `-display`); value node is `markdown-field-display`. `DataCardGrid` automation id is the hardcoded `data-card-grid`. Package `CardGrid` is gone. List card dashboards belong to Discovery.
- `README.md` — after F037 should name spa_utils **1.0.6**
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F037.pin_spa_utils_1_0_6.md` (or shipped successor) — pin already done; use Execution Notes if any local layout or import changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/discovery/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only
- `cypress/e2e/cards.cy.ts` — local CardGrid catalogs (`discovery-home-grid` and the other `discovery-*-grid` ids), rendered card-body markdown (`discovery-card-resource-markdown-body-display` asserts `h2` / `strong`, not raw `##` / `**`), Search by Name, Invite/New, Dismiss/Cancel, Home auto-follow. `.type` calls are `ListPageSearch` inputs (`discovery-resources-search`, `discovery-notifications-search`). None of them open a `MarkdownEditor`.
- `cypress/e2e/navigation.cy.ts` — Token tab and PageFrame chrome `display_name` coverage from the 1.0.3 wave; keep
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/components/CardGrid.vue` — local list grid; automation id is the `automationId` prop, not `data-card-grid`
- `src/components/DiscoveryCard.vue` / `src/components/MarkdownView.vue` — card body HTML is local `MarkdownView`, not package `MarkdownEditor`
- `src/pages/NotificationViewPage.vue` — single `MhCard` placeholder
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through

Cypress runs against **8398**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8398/discovery/config`).

`npm run dev` and `npm run service` both bind host port **8398**. Cypress runs against `npm run service`.

`cy.login()` with no argument seeds an **admin** token. Use `cy.login(['mentee'])` for mentee pages and `cy.login(['admin'])` for Settings. Do **not** change the spa_utils pin in this task. Do **not** add `marked` or `dompurify`.

**Survey (planning time):** no Cypress spec types into a markdown textarea. `cards.cy.ts` reads rendered HTML from local `MarkdownView` inside `discovery-card-…-body-display` and types only into Search by Name inputs. No spec targets package `CardGrid` or `data-card-grid`. The click-or-Enter-then-`${automationId}-input` rule applies only if a spec is typing into `MarkdownEditor` without opening edit mode.

## Goals

- Reconfirm there is no Cypress use of package `CardGrid` or `data-card-grid`. Local grid ids (`discovery-home-grid` and the other `discovery-*-grid` ids) stay. Do not add a markdown field, a `DataCardGrid` page, or a spec whose only purpose is to exercise edit mode.
- Card descriptions stay on local `MarkdownView`. `cards.cy.ts` must still see rendered headings and emphasis (`h2` / `strong`) and must still reject raw markdown markers. Do not click or press Enter on the card body. Do not type into it. There is no `${automationId}-input` textarea on a list card.
- If a spec **does** type into a markdown textarea that is hidden until edit mode, change it to activate the display first (click or Enter on `${automationId}-display`), then type into `${automationId}-input`. Do not type into the resting view. Planning-time survey found no such spec.
- Search by Name `.type` calls stay on the visible `ListPageSearch` inputs. Do not insert a display-activation step. Do not retarget those inputs at `MarkdownEditor`.
- `navigation.cy.ts` and `deployment.cy.ts` still pass. Touch them only if a 1.0.6 selector breaks. Keep Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` assertions. Keep existing catalog / Settings host / logout coverage. Keep CardGrid Search by Name / Invite/New / Dismiss/Cancel / Home auto-follow.
- `README.md` Testing / Automation Support names spa_utils **1.0.6**. State that list dashboards stay on the local `CardGrid` (not package `data-card-grid`), that card bodies are local `MarkdownView` (assert rendered HTML; do not open edit mode), and that package `MarkdownEditor` resting view is owned by spa_utils and is not used on these list pages. Do not claim this SPA added `marked` or `dompurify` for `MarkdownEditor`. The pre-existing direct pins remain only for `MarkdownView`.
- No package `CardGrid` import. No harvest of the local grid into spa_utils. No pin change. No `/discovery/discovery` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils automation ids for chrome and for any real `MarkdownEditor` / `DataCardGrid`. Do not invent a local markdown display or a second card grid to make a selector easier.
- Assert editor behavior at the layer that owns it. List-card markdown is `MarkdownView` HTML with no textarea. A `ListPageSearch` input must not be rewritten as click-to-edit markdown.
- The failure mode to avoid is a spec that looks green because it types into a hidden textarea, a card-body spec “fixed” by opening edit mode on a read-only list card, local `discovery-*-grid` ids rewritten to `data-card-grid`, or the list dashboard replaced so Cypress matches a package component this host does not use.
- Do not retarget catalog specs at `/discovery/config`. Do not wrap list cards in `DataCardGrid` to satisfy a selector. Do not delete local `CardGrid`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg "CardGrid" src cypress` — local `@/components/CardGrid.vue`, `DiscoveryHomePage.vue`, and `cards.cy.ts` route comments only. Zero imports from `@mentor-forge/mentorhub_spa_utils`
  - `rg 'data-card-grid' cypress src` — zero, unless F037 migrated a real multi-card edit/detail page (then assert that page’s `data-card-grid` only; list routes still use `discovery-*-grid`)
  - `rg 'MarkdownEditor|markdown-field-display' cypress src` — zero
  - `rg "from 'marked'|from 'dompurify'" src` — only `MarkdownView.vue`
  - `rg '\.type\(' cypress/e2e/cards.cy.ts` — only Search by Name inputs
- `npm run lint`
- `npm run test`
- `npm run test:coverage` — the `src/api/**`, `src/composables/**`, and `src/components/**` thresholds in `vitest.config.ts` must still hold. Do not change `vitest.config.ts`.
- `npm run build`

**Packaging verification** (required — last task of the 1.0.6 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8398/discovery/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8398**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: a markdown spec typing into a textarea that was never opened; card bodies asserted as a raw textarea while `MarkdownView` renders HTML; Search by Name retargeted at a display node; or list routes switched to `data-card-grid` so a package selector passes.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `README.md` — Testing / Automation Support version **1.0.6**; local `CardGrid` ids stay; card bodies are local `MarkdownView` (assert rendered HTML, do not open edit mode); package `MarkdownEditor` is not used on list pages; no local `data-card-grid`

**Update only if a 1.0.6 selector breaks or a real markdown textarea spec exists:**

- `cypress/e2e/cards.cy.ts` — only if rendered-markdown or grid selectors fail. Keep `h2` / `strong` assertions on `discovery-card-…-body-display`. Keep `discovery-*-grid`. Do not activate edit mode. Do not type into the card body. Search `.type` stays on the search input.
- `cypress/e2e/navigation.cy.ts`, `cypress/e2e/deployment.cy.ts` — only if a 1.0.6 selector breaks
- Any Cypress spec that types into a `MarkdownEditor` textarea without opening edit mode — activate `${automationId}-display`, then type into `${automationId}-input`

Do not change the spa_utils pin. Do not add `marked` or `dompurify`. Do not add a `DataCardGrid` page. Do not pass disallowed `PageFrame` props. Do not edit `src/**` unless a spec failure proves a 1.0.6 selector bug that cannot be fixed in the spec — and do not convert `MarkdownView`, `ListPageSearch`, or the local `CardGrid` into package `MarkdownEditor` / `DataCardGrid` to do it. Do not edit `mentorhub_spa_utils`.

## Execution Notes

### Plan (2026-09-29)
- Reconfirm survey: no Cypress `.type` into markdown textarea; `cards.cy.ts` asserts local `MarkdownView` HTML (`h2`/`strong` on `discovery-card-…-body-display`) and types only into Search by Name (`discovery-resources-search`, `discovery-notifications-search`). Zero `data-card-grid` / `MarkdownEditor` / `markdown-field-display` targets. No Cypress or `src/**` changes expected unless packaging run proves a 1.0.6 selector break.
- Do not change spa_utils pin; do not add `marked`/`dompurify`; do not add DataCardGrid page or convert local CardGrid/MarkdownView.
- Update `README.md` Testing / Automation Support: spa_utils **1.0.6**; local CardGrid ids (not `data-card-grid`); card bodies = local MarkdownView (assert rendered HTML, do not open edit mode); package MarkdownEditor not used on list pages; pre-existing marked/dompurify remain only for MarkdownView.
- Run confirmation searches, lint, test, test:coverage, build.
- Packaging gate: `npm run container`, `npm run service` (with `GITHUB_TOKEN` / `IDP_LOGIN_URI` if needed), `npm run cypress:run` against `http://localhost:8398`. Do not run `npm run dev` alongside service.
- Leave Status Pending for orchestrator.

### Summary (2026-09-29)
Updated README Testing / Automation Support for spa_utils **1.0.6** Cypress boundaries (local `CardGrid` ids, local `MarkdownView` card bodies, package `MarkdownEditor` unused on list pages). No Cypress selector changes and no `src/**` edits; confirmation searches and packaging gate all passed against the freshly built container.

### Test results
- Confirmation searches:
  - `rg "CardGrid" src cypress` — local only (`CardGrid.vue`, `CardGrid.test.ts`, `DiscoveryHomePage.vue` via `@/components/CardGrid.vue`, route-comment strings in `cards.cy.ts`). Zero spa_utils `CardGrid` imports
  - `rg 'data-card-grid' cypress src` — **zero**
  - `rg 'MarkdownEditor|markdown-field-display' cypress src` — **zero**
  - `rg "from 'marked'|from 'dompurify'" src` — only `MarkdownView.vue`
  - `rg '\.type\(' cypress/e2e/cards.cy.ts` — only Search by Name (`discovery-resources-search`, `discovery-notifications-search`)
- `npm run lint` — **pass** (`vue-tsc --noEmit` clean)
- `npm run test` — **pass** (14 files, 125 tests)
- `npm run test:coverage` — **pass**; thresholds held (`src/api` 98%/100%/84%, `src/composables` 98%/91%/74%, `src/components` 100%/100%/97%)
- `npm run build` — **pass**
- `npm run container` — **pass** (`ghcr.io/mentor-forge/mentorhub_discovery_spa:latest`)
- `npm run service` — **pass** (`IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`; `GITHUB_TOKEN` from `GITHUB_FOREVER_TOKEN`; SPA HTTP 200 on `:8398`)
- `npm run cypress:run` — **pass** — 3 specs, 35 tests, 0 failures (`cards.cy.ts` 19, `deployment.cy.ts` 8, `navigation.cy.ts` 8)
- Cypress selector changes: **none**
- Blockers: **none**

Orchestrator reconfirmed searches, `npm run lint`, `npm run test` (125), `npm run build`, and `npm run cypress:run` (35/35) against the packaged SPA on `:8398`. Status set to **Shipped**.
