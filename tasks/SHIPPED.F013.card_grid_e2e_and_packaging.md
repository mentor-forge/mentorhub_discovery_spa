# F013 – Card-grid Cypress coverage and packaging verification

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F012_card_grid_routes_and_pages`  
**Description**: Add headless E2E coverage for the four CardGrid routes (rendered markdown, type variation, Notification dismiss, and `/admin`) and verify the packaged SPA.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — pages tested via E2E; `data-automation-id`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress/e2e/navigation.cy.ts` — updated in F012
- `cypress/support/e2e.ts` — spa_utils `cy.login`
- `src/router/index.ts` — `/`, `/resources`, `/paths`, `/plans`, `/admin` only
- `src/components/DiscoveryCard.vue` — automation IDs from F011

Seed data from `npm run api` / `npm run service` may not include every `Card.type`. Use the cards the API returns, plus intercepts/fixtures when mixed types or dismiss would otherwise be flaky.

## Goals

- Cypress covers:
  - After login, `/` shows a card grid or a documented empty state; `/discovery` is not the landing page.
  - `/resources`, `/paths`, and `/plans` each load their grid (an empty list is acceptable).
  - Card titles come from `name`. Card bodies show **rendered** markdown: assert rendered structure (for example a heading or strong node), not the literal `**` / `# ` source, when the description is markdown.
  - At least two distinct `Card.type` appearances are distinguishable when the payload includes multiple types (home is the likely place). If seed data is single-type, intercept `GET /api/cards` with a small fixture that includes several types.
  - A Notification dismiss control calls `POST /api/notification/dismiss/{notification_id}` and the card leaves the grid (intercept mutate + refetch, or seed + intercept). Dismiss must not also navigate via `link`.
  - `/admin` still loads for an admin login; the drawer still exposes Admin + Logout.
- Existing navigation specs pass against the new routes.
- Packaging: the container image builds; db + API + SPA come up; headless Cypress passes against that stack.

Do **not** switch Cypress to spa_utils `PageFrame` ids (`page-frame-title`, `nav-profile-link`, …) in this task — that is F021 after F019. Keep asserting the F012 local drawer. Do not add `members` / `products` / `notifications` E2E here (F018/F021).

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed so Cypress has a backend
- `npm run cypress:run` — navigation + new card-grid specs pass

**Packaging verification** (required for this last task):

- `npm run container`
- `npm run service`
- `npm run cypress:run`

Record command results in **Execution Notes**. If seed data cannot exercise dismiss or mixed types, document the intercept fixtures used.

## Outputs

Paths are relative to **this SPA repository root**.

**Create:**

- `cypress/e2e/cards.cy.ts` (name may vary) — home/resources/paths/plans grids, markdown render, type variation, dismiss

**Update:**

- `cypress/e2e/navigation.cy.ts` — only if F012 left gaps (admin, logout, `/` landing rather than `/discovery`)
- `cypress/fixtures/**` — only if intercepts need Card fixtures

The agent must not add page-level new buttons or extra Vue routes.

## Execution Notes

- Plan:
  - Add a Cypress card-grid spec that intercepts the four card endpoints with deterministic payloads.
  - Cover the `/` landing grid, rendered markdown, distinct card-type appearances, Notification dismissal without link navigation, and empty states for the three typed list routes.
  - Verify `/admin` and the existing local drawer through the existing navigation coverage, updating it only if a gap is found.
  - Run unit tests, type-checking, build, container packaging, the full service stack, and headless Cypress; record every result here.
- Implemented:
  - Created `cypress/e2e/cards.cy.ts` with four scenarios covering the root landing grid, card names, rendered heading/strong markdown, Resource/Path color and icon variation, empty Resource/Path/Plan routes, Notification dismissal without link navigation, and admin route/drawer access.
  - Used inline `cy.intercept` payloads rather than fixture files. `GET /api/cards` supplies Resource and Path cards for rendering/type checks. The dismiss scenario supplies a linked Notification, mutates the intercepted home list after `POST /api/notification/dismiss/notification-dismiss`, and verifies the invalidation refetch removes it. Typed card endpoints return empty arrays. `GET /api/config` returns an empty deterministic config for all scenarios.
  - `cypress/e2e/navigation.cy.ts` required no changes; its existing `/` landing, Admin, Logout, and local-drawer coverage passed.
- Command results (all run from the SPA root):
  - `npm run test` — passed: 9 files, 48 tests.
  - `npm run lint` — passed (`vue-tsc --noEmit`).
  - `npm run build` — passed; Vite emitted only its existing large-chunk advisory.
  - `npm run container` — passed; built `ghcr.io/mentor-forge/mentorhub_discovery_spa:latest`. Build output reported one high-severity npm audit item and Docker's JSON-form `CMD` recommendation; neither blocked packaging.
  - `npm run service` — passed; recreated and started MongoDB, MongoDB API/SPA, Discovery API, Discovery SPA, and welcome containers.
  - First `npm run cypress:run` — 8/9 tests passed; the new title assertion failed because Vuetify rendered harmless trailing whitespace.
  - Final `npm run cypress:run` after making the title assertion whitespace-tolerant — passed: 2 specs, 9/9 tests (`cards.cy.ts` 4/4; `navigation.cy.ts` 5/5).
- Orchestrator confirmation: `npm run test`, `npm run lint`, `npm run build` passed; `npm run cypress:run` against the already-running packaged stack passed 9/9.
