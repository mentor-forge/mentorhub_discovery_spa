# F036 – 1.0.3 `display_name` Cypress and packaging

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F035_pin_spa_utils_1_0_3`  
**Description**: Point Cypress at spa_utils **1.0.3** Token-tab and PageFrame `display_name` behavior, keep existing Discovery catalog / `/discovery/config` host coverage, and run the packaged SPA as the acceptance gate for [F-DS06 / GitHub #13](https://github.com/mentor-forge/mentorhub_discovery_spa/issues/13).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — Token tab `display_name` → `admin-token-display-name-display`; PageFrame chrome `nav-profile-name-display` inside `nav-profile-link` when JWT `display_name` is present and non-blank; **no** fallback to `name` / `given_name` / `email` / `user_id` / `sub`; missing Token-tab strings render `N/A`. Live Developer Edition / `signCypressJwt` tokens may still omit `display_name` — stub intercepts / JWT payload in Cypress rather than synthesizing claims in app code
- `README.md` — after F035 should name spa_utils **1.0.3**; Automation Support may still omit Token `display_name` ids
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `tasks/PENDING.F035.pin_spa_utils_1_0_3.md` (or shipped successor) — pin and local token-claim alignment already done; use Execution Notes if types/fixtures changed
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/support/e2e.ts` — `registerAuthCommands({ visitPath: '/discovery/' })`
- `cypress/support/commands.ts` — `visitPrefixed` only; spa_utils demo `stubJwtDisplayName` is **not** a packaged export — do not copy the demo helper into this repo unless a tiny inline JWT patch in a spec is required. Do **not** treat `PerformanceNavigationTiming.name` as a token field.
- `cypress/e2e/navigation.cy.ts` — `GET **/discovery/api/config` token currently has `profile_id` / `customer_id` / `mentor_id` only; Token tab asserts those three ids; chrome asserts `nav-profile-link` but not `nav-profile-name-display`; mentee is redirected away from `/discovery/config`
- `cypress/e2e/cards.cy.ts` — CardGrid, Search by Name, Invite/New, Dismiss/Cancel, Home auto-follow; **keep**
- `cypress/e2e/deployment.cy.ts` — nginx prefix / API proxy; keep unless a selector breaks
- `src/pages/AdminPage.vue` — packaged `AdminPage` pass-through of `config.token`

Cypress runs against **8398**. `npm run dev` and `npm run service` both bind host port **8398**. Cypress runs against `npm run service`.

**Discovery SPA constraint:** do **not** weaken `requiresRole` / `/config` admin gating to make chrome easier to screenshot. Do **not** change the spa_utils pin in this task.

## Goals

- **Token tab (present):** after admin Settings navigation to `/discovery/config`, stub `GET **/discovery/api/config` with a `token` object that includes `display_name` plus the existing `profile_id`, `customer_id`, and `mentor_id`. Open `admin-tab-token` and assert `admin-token-display-name-display` (read-only input value) **and** the three existing id displays. Do not assert a token `name` field.
- **Token tab (missing):** a second intercept whose token omits `display_name` (and does not supply `name` / `given_name` / `email` as a substitute) must show `N/A` on `admin-token-display-name-display`. This is the failure mode that would look correct if spa_utils still mapped `name` → display.
- **PageFrame chrome:** default `cy.login(['mentee'])` / `cy.login(['admin'])` may remain compact (no `nav-profile-name-display`) because `signCypressJwt` omits the claim. If this SPA asserts chrome `display_name`, patch the stored JWT payload in the spec (or a one-off command) and reload — do not add app-code fallbacks and do not vendor spa_utils demo `commands.ts`. When the claim is stubbed, `nav-profile-name-display` inside `nav-profile-link` shows the stubbed name. When it is absent, that node is omitted.
- Existing F029 / F034 coverage still passes: 1.0.1 hamburger catalog, Settings `href` on hosting `/discovery/config`, Events/Home/Notifications, mentee `/discovery/config` gate, logout `return_to` including `/discovery/`, CardGrid Search by Name / Invite/New / Dismiss/Cancel / Home auto-follow.
- `cards.cy.ts` and `deployment.cy.ts` still pass; touch them only if a 1.0.3 selector breaks. Do not retarget Search by Name or card `name` assertions at the token claim.
- `README.md` Testing / Automation Support lists Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils 1.0.3 ids this host asserts (not local `nav-*` ids).
- No local Token UI. No `/discovery/discovery` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils PageFrame / TokenClaimsCard automation ids; do not invent a local Token card.
- Assert `display_name` at the layer that owns it: config intercept → Token tab; JWT localStorage → chrome. A test that only checks final text without the stubbed source would miss a leftover `token.name` mapping.
- Do not restore a local drawer. Do not pass disallowed `PageFrame` props.
- Prefer extending `navigation.cy.ts` over adding a new spec file unless the file becomes unreadable.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirmation searches:
  - `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md`
  - `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md`
- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `npm run build`

**Packaging verification** (required — last task of the F-DS06 / 1.0.3 set):

- `npm run container` — build the SPA container image
- `npm run service` — run db + API + SPA containers
- `npm run cypress:run` — headless end-to-end tests (long running); **all** specs must pass against `http://localhost:8398/discovery/...`

Do not run `npm run dev` and `npm run service` at the same time — both bind host port **8398**.

Record results in **Execution Notes**. The gate that would look correct while bypassing the intended boundary is: Token tab populated from `name` / `given_name` / `email` while `display_name` is absent; chrome showing a fabricated name when the JWT claim is missing; or Token tab still omitting `admin-token-display-name-display` after the 1.0.3 pin.

Env notes from prior waves: `GITHUB_FOREVER_TOKEN` as `GITHUB_TOKEN` if the file token is denied by GHCR; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout specs do not hang on a Tailscale IdP host.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — config token stub includes `display_name`; Token tab present + missing (`N/A`) assertions; optional JWT chrome stub for `nav-profile-name-display`; keep existing catalog / Settings host / mentee config gate / logout coverage
- `cypress/e2e/deployment.cy.ts` — only if a prefix assertion must mention Token ids
- `cypress/e2e/cards.cy.ts` — only if a 1.0.3 selector breaks (`cards.cy.ts` must remain CardGrid / Search by Name / Invite/New coverage)
- `cypress/support/commands.ts` / `cypress/support/e2e.ts` — only if a minimal JWT `display_name` stub is required and cannot live inline in the spec
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — Testing / Automation Support 1.0.3 Token `display_name` and chrome ids

Do not restore a local drawer. Do not change the spa_utils pin. Do not add an Events or CardGrid route. Do not pass disallowed `PageFrame` props. Do not implement `display_name` fallbacks in `src/**`. Do not rename Card / Notification / Search by Name `name` fields.

## Execution Notes

### Plan

1. Keep spa_utils pin at exact **1.0.3**. Do not touch `src/**` or add `display_name` fallbacks.
2. Extend `cypress/e2e/navigation.cy.ts` (no new spec file):
   - Add `display_name` to the default `GET **/discovery/api/config` token stub alongside existing `profile_id` / `customer_id` / `mentor_id`.
   - After Settings navigation (`nav-settings-link` → `/discovery/config`), assert Token-tab `admin-token-display-name-display` input value **and** the three id displays. Do not assert a token `name` field.
   - Second intercept: omit `display_name`; include decoy `name` / `given_name` / `email` (the leftover-mapping failure mode) and assert `N/A` on `admin-token-display-name-display`.
   - Default `cy.login` chrome stays compact (`nav-profile-name-display` absent). Optional chrome present case: inline JWT payload patch + reload (do **not** vendor spa_utils demo `stubJwtDisplayName`). Intercept config so the unsigned patched JWT cannot 401 `loadConfig`. Assert `nav-profile-name-display` inside `nav-profile-link`.
   - Keep existing Events/Home/Notifications, mentee `/discovery/config` gate, logout `return_to`, and host chrome coverage.
3. Leave `cards.cy.ts` / `deployment.cy.ts` / `commands.ts` / `e2e.ts` unless a 1.0.3 selector or JWT stub requires a change. Do not retarget Search by Name or card `name` at the token claim.
4. README Testing / Automation Support: list Token-tab `admin-token-display-name-display` and chrome `nav-profile-name-display` as spa_utils **1.0.3** ids this host asserts.
5. Confirmation searches, lint, unit tests, coverage, build, then packaging (`container` / `service` / `cypress:run`). If Cypress fails on card person names because Discovery API still projects `Card.name` from `Profile.name`/`full_name` while live Profile docs use `display_name`, Block rather than rewriting API or adding src fallbacks.

### Summary (2026-09-03)

Extended Cypress against spa_utils **1.0.3** Token-tab and PageFrame `display_name` without changing the pin or adding local fallbacks. `GET **/discovery/api/config` token stub now includes `display_name`; Token tab asserts `admin-token-display-name-display` plus the three ids. A second intercept omits `display_name` and supplies decoy `name` / `given_name` / `email` so leftover mapping would fail — UI shows `N/A`. Default login chrome stays compact; an inline JWT payload patch + reload asserts `nav-profile-name-display` inside `nav-profile-link`. README Testing / Automation Support lists those 1.0.3 ids as host-asserted. Packaging gate passed against `http://localhost:8398/discovery/...`. Card person-name API mismatch did not surface (card specs intercept fixtures).

**Files changed**
- `cypress/e2e/navigation.cy.ts` — Token present + missing (`N/A` / decoys), compact chrome, stubbed JWT chrome
- `README.md` — Testing / Automation Support 1.0.3 Token and chrome ids
- this task file (plan, results, status)

**Unchanged**
- spa_utils pin remains exact `1.0.3`
- `cards.cy.ts`, `deployment.cy.ts`, `commands.ts`, `e2e.ts`, fixtures, `src/**`

**Confirmation searches**
- `rg 'token\.name|token\[.name.\]|token\.get\(.name.\)' src cypress README.md` — zero hits
- `rg 'display_name|admin-token-display-name-display|nav-profile-name-display' cypress README.md` — `navigation.cy.ts` (stubs + assertions) and README docs only

**Test results**
- `npm run lint` — clean (`vue-tsc --noEmit`)
- `npm run test` — 14 files / **125 passed**
- `npm run test:coverage` — 125 passed; existing scoped thresholds held (`src/api` 98.14% lines / 100% funcs / 84% branches; `src/composables` 98.11% / 90.9% / 74.35%; `src/components` 100% / 100% / 97.43%)
- `npm run build` — `vue-tsc` + Vite production build clean. Pre-existing Vite notes: `/discovery/runtime-config.js` without `type="module"`; some chunks > 500 kB
- `npm run container` — pass; image `ghcr.io/mentor-forge/mentorhub_discovery_spa:latest` (`sha256:556a86fb7a761dcc1fbb40010d0e29e9ef28d891deaef6b4087c646501d96bb2`); Docker `JSONArgsRecommended` warning; npm install reported 2 audit vulnerabilities and install-script warnings during image build
- `npm run service` — pass; `mh down && mh up discovery && npm run open` with `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` and `GITHUB_TOKEN` from `GITHUB_FOREVER_TOKEN`
- `npm run cypress:run` — pass against `http://localhost:8398`: `cards.cy.ts` 19/19, `deployment.cy.ts` 8/8, `navigation.cy.ts` 8/8; **35/35 passing**, 0 failing

**Env workarounds**
- Exported `GITHUB_TOKEN` from `~/.mentorhub/GITHUB_FOREVER_TOKEN` before `npm run service`
- Set `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html` before `mh up` so logout/IdP specs stay on the local Developer Edition IdP (runtime-config confirmed)

**Blockers**: none

