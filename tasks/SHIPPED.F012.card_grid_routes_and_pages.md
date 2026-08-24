# F012 – Card-grid routes, pages, and Notification dismiss wiring

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F011_discovery_card_component`  
**Description**: Replace the Discovery stub with CardGrid list pages at `/`, `/resources`, `/paths`, and `/plans`, keep `/admin`, remove every other Vue route, and wire Notification dismiss to the API mutation. Do not add the deferred page-level new buttons.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — TanStack Query, `data-automation-id` `{domain}-{page}-{element}`, pages covered by E2E
- `../mentorhub_spa_utils/README.md` — `CardGrid` + `MhCard`; list GET is offset/size **headers** + JSON array; no infinite-scroll helpers
- `README.md` — currently describes the `/discovery` landing stub
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — `/` redirects to `/discovery`; `/discovery` stub; `/admin` kept
- `src/App.vue` — drawer item `to="/discovery"`
- `src/App.test.ts`
- `src/pages/DiscoveryHomePage.vue`
- `src/pages/AdminPage.vue` — keep
- `src/api/client.ts` — F010 list + dismiss methods
- `src/components/DiscoveryCard.vue` — F011
- `src/main.ts` — Vue Query already registered
- `cypress/e2e/navigation.cy.ts` — visits `/discovery` and currently asserts leftover mentee drawer IDs are absent

**Vue Router table for this issue:**

| Path | List source | Notes |
| --- | --- | --- |
| `/` | `GET /api/cards` | Default landing; composite home list |
| `/resources` | `GET /api/cards/resources` | |
| `/paths` | `GET /api/cards/paths` | |
| `/plans` | `GET /api/cards/plans` | |
| `/admin` | existing Admin page | Keep (auth + `admin` role) |

Remove `/discovery` and the `/` → `/discovery` redirect. Do **not** add `/members`, `/mentees`, `/notifications`, `/products`, `/customer`, `/settings`, or other Card list routes in this task — catalog lists `members/`, `products`, and `notifications` are **F018** (F-DS03).

**Out of scope**: new/create buttons on these pages (future issue). Do not add them as hidden or disabled controls. Do not adopt `PageFrame` here (F019).

## Goals

- Authenticated landing is `/` and renders a `CardGrid` of F011 `DiscoveryCard`s from `GET /api/cards` via TanStack Query (query key e.g. `['cards', 'home']`). Loading, empty, and error states have `data-automation-id`s.
- `/resources`, `/paths`, and `/plans` use the same card-grid pattern against the matching client method. Prefer one shared list view parameterized by route meta over four copy-pasted pages.
- Pagination uses `offset`/`size` request headers (defaults `0`/`20`). First page is enough; do not add infinite scroll.
- Clicking a card with `link` opens that URI. Notification cards show dismiss; confirm calls the F010 dismiss method with `card._id`, stops click-through, and **invalidates** card queries on success so the card leaves the home grid.
- `src/router/index.ts` registers only the five paths in the table (plus existing auth/role guards). The `/admin` role-guard fallback targets the home route, not `Discovery`.
- `src/App.vue` drawer: Home → `/`; Resources → `/resources`; Paths → `/paths`; Plans → `/plans`; keep Admin + Logout. Stable IDs such as `nav-home-link`, `nav-resources-link`, `nav-paths-link`, `nav-plans-link`. Replacing `nav-discovery-link` is a breaking UI-API change — update unit and Cypress selectors in this task.
- `README.md` describes the four card-grid routes and `/admin`; it no longer calls `/discovery` the landing page.
- `cypress/e2e/navigation.cy.ts` visits `/` (not `/discovery`) and expects the new drawer links. Do **not** keep assertions that `nav-resources-link` / `nav-paths-link` must be absent.
- No page-level add/new buttons.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install` — if the F011 lockfile changed and was not installed locally (run `mh` first).
- `npm run test` — composable tests for card queries and dismiss invalidation; `App.test.ts` still passes; API and DiscoveryCard tests still pass.
- `npm run lint`
- `npm run build`

Update `cypress/e2e/navigation.cy.ts` here so F013 is not blocked by stale `/discovery` visits. Full Cypress + packaging are F013. Pages are verified by E2E there, not by page-level Vitest.

## Outputs

Paths are relative to **this SPA repository root**.

**Create** (adjust names if a shared page is used):

- `src/composables/useCards.ts` — queries + dismiss mutation
- `src/composables/useCards.test.ts`
- Shared and/or per-route page components under `src/pages/` (for example a parameterized list page plus thin route wrappers)

**Update:**

- `src/pages/DiscoveryHomePage.vue` — home grid, or replace/rename and delete the stub
- `src/router/index.ts` — route table
- `src/App.vue` — drawer links
- `src/App.test.ts` — drawer stubs/assertions if it mounts nav items
- `README.md` — landing and route list
- `cypress/e2e/navigation.cy.ts` — `/` and new nav automation IDs

Do not add deferred new-entity buttons. Do not remove `src/pages/AdminPage.vue`.

## Execution Notes

- Plan:
  - Add a shared TanStack Query composable for the four first-page card sources and notification dismissal, invalidating all card queries after a successful dismiss.
  - Replace the landing stub with one route-meta-driven CardGrid page that provides loading, empty, error, card-link, and notification-dismiss behavior for `/`, `/resources`, `/paths`, and `/plans`.
  - Restrict the router and drawer to the required routes/links, update unit and Cypress navigation expectations, and refresh the README route documentation.
  - Run the full unit suite, lint/type-check, and production build from the SPA root.
- Implemented:
  - Added `useCards` with first-page (`offset=0`, `size=20`) queries for home, resources, paths, and plans plus notification dismissal and `['cards']` invalidation.
  - Replaced the landing stub with a route-meta-driven CardGrid page and loading, empty, query-error, and dismiss-error states.
  - Registered only `/`, `/resources`, `/paths`, `/plans`, and role-guarded `/admin`; updated the drawer, README, unit expectations, and Cypress navigation selectors.
  - Kept `AdminPage.vue`; added no page-level create controls and did not adopt `PageFrame`.
- Verification:
  - `npm install` not needed; the existing install resolved all dependencies.
  - `npm run test` — passed (9 files, 48 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed (Vite emitted its existing large-chunk advisory).
- Blockers: none.
