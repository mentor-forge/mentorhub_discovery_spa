# F035 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.3` (`token.display_name`)

**Status**: Shipped  
**Type**: Feature  
**Depends On**: _(none — first task in this wave)_  
**Description**: This repo owns the Discovery SPA **1.0.3 pin** ([F-DS06 / GitHub #13](https://github.com/mentor-forge/mentorhub_discovery_spa/issues/13)). Bump `@mentor-forge/mentorhub_spa_utils` from exact `1.0.2` to exact **`1.0.3`**, refresh the lockfile from CodeArtifact, and replace any local use of token `name` with token `display_name`. Do **not** change routes or CardGrid behavior in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — exact semver pins for shared packages; CodeArtifact (`mh` then `npm install`)
- `../mentorhub_spa_utils/README.md` — install pin **1.0.3**; **PageFrame** shows JWT `display_name` next to the avatar (`nav-profile-name-display`) with **no** fallback to `name` / `given_name` / `email` / `user_id` / `sub`; Token tab (`TokenClaimsCard`) field `display_name` with id `admin-token-display-name-display`; missing string claims display `N/A`
- `README.md` — currently documents spa_utils **1.0.2**; Automation Support lists `nav-profile-link` but not `nav-profile-name-display` or Token `display_name`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `"@mentor-forge/mentorhub_spa_utils": "1.0.2"`
- `src/App.vue` — `PageFrame` with `page-title="Discovery"` plus `provideEditorConfig` (keep; do not add `navItems`, ALB URLs, or role tables)
- `src/initAuth.ts` — keep IdP bootstrap / `urlAuthBootstrap` as today
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from spa_utils and passes `GET /discovery/api/config` (do not fork TokenClaimsCard locally)
- `src/api/types.ts` — `ConfigResponse.token` is currently `{ claims?: Record<string, unknown> }`
- `src/api/client.test.ts` — config mock `token: { claims: {} }`
- `src/composables/useConfig.ts` / `src/composables/useConfig.test.ts` — enumerator / collection `name` fields are **not** the token display claim
- `src/composables/useRoles.ts` / `src/composables/useRoles.test.ts` — config token `roles` fallback; do not invent token `name`
- `src/api/types.ts` `Card.name` / `Notification.name` and Search by Name (`?name=`) are **document** fields — do not rename
- `vitest.config.ts` — inlines `@mentor-forge/mentorhub_spa_utils`; no version comment to update unless 1.0.3 changes the inline setting
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`; spa_utils Cypress subpaths `cypress/jwtDefaults` and `cypress/registerJwtSignTask`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/discovery/' })`

**Source issue**: [F-DS06](https://github.com/mentor-forge/mentorhub_discovery_spa/issues/13) ("Bump spa_utils to latest release (1.0.3) - replace any use of token.name with token.display_name"). This task delivers **the pin and any local token-claim source/type/doc alignment**. Cypress Token-tab / chrome assertions and packaging are **F036**.

**External prerequisite**: `mentorhub_spa_utils` F047–F049 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.3` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/discovery/`, the 1.0.1 catalog, `/discovery/config` Settings host, and CardGrid dashboards are already shipped (F014–F034). Run `mh`, then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.3** is not available, set this task **Status** to `Blocked`, rename the file to `BLOCKED.F035.pin_spa_utils_1_0_3.md`, and stop — do not stay on `1.0.2` and do not point `package.json` at a git URL or sibling path.

This SPA **owns this repo’s pin**. Sibling SPAs pin independently; do not change other repos.

**Token vs document `name`:** Card `name`, Notification `name`, enumerator `name`, collection `name`, Search by Name `?name=`, and Cypress `PerformanceNavigationTiming.name` (document URL) are **not** the authenticated token display claim. Only JWT / `/discovery/api/config` `token` display-field usage that still says `name` becomes `display_name`.

**Out of scope**: Cypress catalog, Token-tab, or chrome specs (F036). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally. Do not add a local `display_name ?? name` shim. Do not fork `TokenClaimsCard` or `PageFrame` chrome. Do not add, rename, or delete CardGrid, `/config`, `/events`, or notification routes.

### Wave ordering

Pin + local token-claim alignment (F035) → Cypress `display_name` coverage and packaging (F036). Pinning first makes 1.0.3 `PageFrame` chrome and `TokenClaimsCard` `display_name` available before F036 asserts them in the browser.

## Goals

- `package.json` pins `"@mentor-forge/mentorhub_spa_utils": "1.0.3"` — exact semver, **no caret**.
- `package-lock.json` resolves `1.0.3` from the CodeArtifact registry after `mh` and `npm install --include=dev`.
- `npm ls @mentor-forge/mentorhub_spa_utils` reports `1.0.3`.
- There are zero local reads of token `name` in SPA source, unit tests, or README where the value is meant to come from the authenticated token / `/discovery/api/config` token contract. Remaining `name` hits are document, enumerator, search-query, or navigation-timing fields.
- If `ConfigResponse.token` (or unit fixtures that model that payload) still encode a token display field as `name`, change it to `display_name`. Do not invent a nested-vs-flat compatibility layer; keep the existing `AdminPage` pass-through of `config.token`.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (`page-title="Discovery"`). Keep `provideEditorConfig`. IdP bootstrap / `urlAuthBootstrap` / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils.
- `README.md` names the pinned version **1.0.3** wherever it currently says 1.0.2 (architecture table, install note, layout chrome). Document that Token-tab `display_name` (`admin-token-display-name-display`) and PageFrame chrome `nav-profile-name-display` are owned by spa_utils 1.0.3. Do not invent a local display-name mapping. Keep the existing 1.0.1/1.0.2 hamburger catalog wording unless spa_utils 1.0.3 actually changed catalog membership.
- Fix any `src/**` import or type breakage from 1.0.3. Do not add, rename, or delete routes. Keep the existing `AdminPage` wrapper and CardGrid pages.
- `vitest.config.ts` may be touched **only** if 1.0.3 changes whether the package must be inlined for Vitest. Do not change coverage thresholds.
- The three spa_utils Cypress subpath imports still resolve under 1.0.3: `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, and `cypress/registerAuthCommands`. If a subpath or option name moved, update the import here — do **not** vendor a local copy. Do not rewrite `navigation.cy.ts` Token or chrome expectations here.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Treat DRY as avoiding duplicated knowledge: Token-tab fields and avatar chrome are owned by 1.0.3 `TokenClaimsCard` / `PageFrame`. Do not grow a parallel Token UI.
- Keep journey-specific behavior in this SPA (CardGrid dashboards, Search by Name, Invite/New, notification Dismiss/Cancel, Home auto-follow).
- Do not introduce local workarounds that accept both token `name` and `display_name`. Prefer proving no production-code change is needed over speculative typing churn.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` (CodeArtifact auth) then `npm install --include=dev`
- `npm ls @mentor-forge/mentorhub_spa_utils` — confirm **1.0.3**
- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src README.md`
  - `rg 'display_name' src README.md`
  - Review remaining `name` hits in `src` and prove they are Card / Notification / enumerator / collection / Search by Name fields, not token display claims
- `npm run lint` — `vue-tsc --noEmit` must be clean
- `npm run test` — full Vitest suite
- `npm run test:coverage` — existing coverage still holds; record unrelated pre-existing gaps separately
- `npm run build` — `vue-tsc` + Vite production build must be clean

Do **not** run `npm run cypress:run` in this task. Existing Cypress Token stubs omit `display_name` and do not assert `admin-token-display-name-display` or `nav-profile-name-display`. Leave those specs to F036. Do not “fix” them here unless a unit test or `vue-tsc` fails.

Packaging (`npm run container` / `npm run service`) is **F036**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.3"`
- `package-lock.json` — resolved 1.0.3 from CodeArtifact
- `README.md` — spa_utils version note **1.0.3**; Token / chrome `display_name` ownership (`admin-token-display-name-display`, `nav-profile-name-display`); keep existing `/discovery/config` Settings host and CardGrid ownership wording
- `src/api/types.ts` — only if token typing should include `display_name` (do not add a `name` alias)
- `src/api/client.test.ts` / `src/composables/useConfig.ts` / `src/composables/useConfig.test.ts` / `src/composables/useRoles.ts` / `src/composables/useRoles.test.ts` — only if they read a token display field
- `vitest.config.ts` — only if 1.0.3 requires a change to the inline setting
- `cypress.config.ts`, `cypress/support/e2e.ts` — only if a spa_utils Cypress subpath or option moved in 1.0.3
- Any `src/**` import or type that fails to compile against 1.0.3

Do not change CardGrid, `/config`, `/events`, or notification routes. Do not pass disallowed `PageFrame` props. Do not change Cypress specs in this task unless a compile of test helpers breaks. Do not change `src/router/index.ts`, `vite.config.ts`, `nginx.conf.template`, or `Dockerfile`. Do not rename Card / Notification / Search by Name `name` fields.

## Execution Notes

### Plan

1. Confirm `@mentor-forge/mentorhub_spa_utils@1.0.3` is published (`mh`, then `npm view`). If not, Blocked and stop.
2. Pin `package.json` to exact `1.0.3` and refresh `package-lock.json` via `npm install --include=dev`. Confirm with `npm ls`.
3. Search `src` / `README.md` for token `name` vs `display_name`. Remaining `name` hits are Card / Notification / enumerator / collection / Search by Name fields — leave them. Do not add a local `display_name ?? name` shim.
4. `ConfigResponse.token` is `{ claims?: Record<string, unknown> }` with no typed display field; fixtures do not encode token `name`. Leave types/composables unless 1.0.3 compile fails. Cypress subpaths unchanged in spa_utils 1.0.3 — leave `cypress.config.ts` / `e2e.ts` unless imports break.
5. Update `README.md` 1.0.2 → 1.0.3; document Token-tab `display_name` (`admin-token-display-name-display`) and PageFrame chrome `nav-profile-name-display` as spa_utils-owned. Keep 1.0.1/1.0.2 hamburger catalog wording.
6. Run lint, test, coverage, build. Do not run Cypress. Rename PENDING → SHIPPED after success.

### Results

- Branch: `F-DA06-TokenUpdate` (unchanged).
- `mh` + `npm view @mentor-forge/mentorhub_spa_utils version` → **1.0.3** (published to CodeArtifact; versions include 1.0.3).
- `package.json` pin: `"@mentor-forge/mentorhub_spa_utils": "1.0.3"` (exact, no caret).
- `npm install --include=dev` resolved lockfile from CodeArtifact:
  `https://mentor-forge-560167829275.d.codeartifact.us-east-1.amazonaws.com/npm/mentorhub-npm/@mentor-forge/mentorhub_spa_utils/-/mentorhub_spa_utils-1.0.3.tgz`
- `npm ls @mentor-forge/mentorhub_spa_utils` → `@mentor-forge/mentorhub_spa_utils@1.0.3`
- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src README.md` — **zero hits**
  - `rg 'display_name' src README.md` — README only (spa_utils ownership docs); no local source mapping
  - Remaining `src` `name` hits are Card / Notification document fields, Search by Name `?name=`, enumerator / collection names, Vue component `name`, router route names, HTTP header `name`, and `useAppTitle` profile-title helper — **not** token display claims
- No `src/**` compile breakage against 1.0.3. Left `types.ts`, composables, tests, `vitest.config.ts`, and Cypress helpers unchanged (Cypress subpaths still `cypress/jwtDefaults`, `cypress/registerJwtSignTask`, `cypress/registerAuthCommands`). Did not add a `display_name` type or `name` alias.
- Tests (from SPA repo root; Cypress **not** run):
  - `npm run lint` — clean (`vue-tsc --noEmit`)
  - `npm run test` — 14 files / **125 passed**
  - `npm run test:coverage` — 125 passed; existing scoped thresholds held (`src/api` 98.14% lines / 100% funcs / 84% branches; `src/composables` 98.11% / 90.9% / 74.35%; `src/components` 100% / 100% / 97.43%). Unrelated pre-existing gaps: `src/initAuth.ts`, `src/composables/useAuth.ts` (re-export), Cypress specs, and `public/runtime-config.js` sit outside those thresholds and remain at 0% in the workspace report.
  - `npm run build` — `vue-tsc` + Vite production build clean. Pre-existing Vite notes: `/discovery/runtime-config.js` without `type="module"`; some chunks > 500 kB.
- F036 not implemented. No commit / push / PR.

