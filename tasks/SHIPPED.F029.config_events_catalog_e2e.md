# F029 – 1.0.1 catalog, `/config`, Events Cypress and packaging

**Status**: Shipped
**Type**: Feature
**Depends On**: `F028_events_card_grid_list`
**Description**: Point Cypress at the spa_utils **1.0.1** hamburger catalog, prove Settings opens this SPA’s `/discovery/config`, cover Token claims, admin-gate `/config`, and make `nav-events-link` reach `/discovery/events`. Verify the packaged SPA.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.1)**: catalog table; removed ids `nav-products-link`, `nav-customer-link`, `nav-customer-members-link`; new `nav-events-link`; kept `nav-settings-link` whose href is `hostingConfigHref()` (hosting origin, **no** `:8080` rewrite); Notifications + Settings **admin-only**; empty/missing roles → Home + Events; logout `return_to` = `buildJourneyUrl('discovery')` → `/discovery/`; Token tab ids
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/e2e/navigation.cy.ts` — still encodes 1.0.0 catalog (customer/products rows, Settings → `/admin/settings`, mentee Notifications)
- `cypress/e2e/cards.cy.ts` — seven CardGrid empty visits + retained `/discovery/admin`
- `src/router/index.ts` — `/config` (F027), `/events` (F028)

Cypress runs against **8398**. Collection hamburger `href`s from `buildJourneyUrl` still include **`:8080`**. **Settings is the exception:** `hostingConfigHref()` stays on the current origin (`http://localhost:8398/discovery/config`), not welcome `:8080`, and not `/admin/settings`.

Logout after 1.0.1: `return_to` must include the ALB `/discovery/` path (welcome `:8080`), not SPA root `/` alone. Update the F021 comment that treated missing `/discovery/` as a spa_utils limitation.

## Goals

- **Catalog (admin login):** `nav-settings-link` is visible and **admin-only**. Clicking it opens **this** SPA at pathname `/discovery/config` (stay on 8398; do not require `:8080` on that href). Token tab shows `profile_id` / `customer_id` / `mentor_id` via `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display` (stub `GET /discovery/api/config` token claims when the live payload is not guaranteed).
- **Removed hamburger rows:** `nav-products-link`, `nav-customer-link`, and `nav-customer-members-link` are **absent** for every role checked (admin, customer, mentor, mentee).
- **Notifications** (`nav-notifications-link`) and **Settings** only for `admin`. A mentee-only (or empty-role) login shows **Home + Events** and must **not** show Notifications or Settings.
- **Events:** `nav-events-link` is visible for authenticated users (including mentee). Href is welcome/ALB `http://localhost:8080/discovery/events`. Visiting `/discovery/events` is not a 404 (empty grid OK). Include Events in the CardGrid empty-route sweep.
- **Config gate:** `cy.login` without `admin` visiting `/discovery/config` is redirected away (Home). An admin visit stays on `/discovery/config`.
- **Logout:** after `nav-logout-link`, IdP stub still loads and `return_to` includes `/discovery/` (welcome origin), not a hardcoded `127.0.0.1` SPA URL and not bare `/` as the only path.
- Existing card markdown / type / dismiss / search / Invite / New coverage from F025 still passes. `/discovery/admin` may still resolve if F027 kept an alias; prefer asserting `/discovery/config` as the Settings host.
- No `/discovery/discovery` in `cy.url()` or `href`.

### Craftsmanship Expectations

- Use spa_utils PageFrame automation ids; do not invent a local drawer.
- Assert Settings at the layer that owns it (`hostingConfigHref` on the current origin) and Events at the layer that owns it (`buildJourneyUrl` on welcome `:8080`). A test that only checks the final page without the href origin would miss a `:8080` rewrite bug on Settings.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed
- `npm run cypress:run`

**Packaging verification** (required — last task of the F-DS04 / 1.0.1 set):

- `npm run container`
- `npm run service`
- `npm run cypress:run`

Record results in **Execution Notes**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — 1.0.1 catalog, Settings `/discovery/config`, Events, admin-only Notifications/Settings, logout `return_to=/discovery/`
- `cypress/e2e/cards.cy.ts` — Events empty route; config/admin host; Token tab if it belongs with page coverage rather than navigation (split to a new `cypress/e2e/*.cy.ts` only if that keeps files readable, then list it here)
- `cypress/fixtures/**` — only if Token/config intercepts need a fixture
- `README.md` — only if E2E notes still describe the 1.0.0 hamburger

Do not restore a local drawer. Do not change the spa_utils pin. Do not localize CardGrid in this task.

## Execution Notes

- Plan: rewrite the navigation Cypress coverage for the spa_utils 1.0.1 catalog and role
  gates; assert Settings on the hosting `:8398` origin, Events on the welcome `:8080`
  origin, admin config/token claims, config authorization, and the corrected logout
  `return_to`; add Events and `/config` to the CardGrid/page route coverage.
- Verification plan: run `npm run test`, `npm run lint`, `npm run build`,
  `npm run container`, `npm run service`, wait for port 8398, then run
  `npm run cypress:run` and fix E2E-only failures within the listed outputs.
- Rewrote the navigation coverage for the 1.0.1 catalog. Mentor receives Home, Events,
  Resources, Paths, and Plans; customer and mentee receive Home and Events; only admin
  receives Notifications and Settings. Every checked role proves the removed Products,
  Customer, and Customer Members automation ids are absent.
- Settings is asserted before navigation as
  `http://localhost:8398/discovery/config` (hosting origin, never `:8080` or
  `/admin/settings`). Events is independently asserted as
  `http://localhost:8080/discovery/events` (welcome/ALB origin). URL and href checks reject
  `/discovery/discovery`.
- Admin Settings navigation stubs `GET /discovery/api/config` with direct fields on the
  response `token` object, matching spa_utils `TokenClaimsCard`'s runtime input. The Token
  tab verifies `profile_id`, `customer_id`, and `mentor_id` through the three package-owned
  automation ids. Config routing proves a mentee is redirected to Home while admin remains
  at `/discovery/config`.
- Events is included in the CardGrid empty-route sweep and renders
  `discovery-events-empty`. The preferred admin page assertion now uses `/discovery/config`;
  `/discovery/admin` is still covered as the retained alias.
- Logout now parses the IdP stub's `return_to` and proves welcome origin
  `http://localhost:8080/discovery/`, rejecting `127.0.0.1`, a bare root path, and a
  duplicated Discovery prefix.
- Verification from the SPA repository root:
  - `npm run test` — passed: 11 files, 85 tests.
  - `npm run lint` — passed (`vue-tsc --noEmit`).
  - `npm run build` — passed: 648 modules transformed. Existing non-fatal
    runtime-config script and large-chunk warnings remain.
  - `npm run container` — passed and produced
    `ghcr.io/mentor-forge/mentorhub_discovery_spa:latest`. The first two attempts timed out
    fetching `node:24-alpine` metadata; `docker pull node:24-alpine` completed, and the
    unchanged build then passed. Docker reported its existing JSON-form `CMD` recommendation,
    and npm reported one high-severity dependency audit finding during image install.
  - `npm run service` — passed: `mh down`, `mh up discovery`, and `npm run open` all
    completed; `http://localhost:8398/discovery/` responded successfully.
  - `npm run cypress:run` — final run passed: 3 specs, 29 tests, 29 passing, 0 failing,
    0 pending, 0 skipped. Breakdown: `cards.cy.ts` 14/14, `deployment.cy.ts` 8/8,
    `navigation.cy.ts` 7/7.
  - Two earlier Cypress runs were 28/29 because the Token fields were initially asserted
    via wrapper text instead of their read-only input values. The intercept was aligned to
    the direct `token` object and the package-owned inputs are now asserted with
    `have.value`; the complete suite was rerun green.
