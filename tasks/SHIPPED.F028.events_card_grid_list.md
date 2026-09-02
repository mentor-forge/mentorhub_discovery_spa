# F028 – Events CardGrid list at `/discovery/events`

**Status**: Shipped
**Type**: Feature
**Depends On**: `F027_host_admin_page_at_config`
**Description**: Add an Events CardGrid/list at `/discovery/events` (`path: '/events'`, spa_utils `JOURNEY_APP_PATHS.events`) so hamburger `nav-events-link` is not a dead ALB path. Keep existing list pages. Config remains in addition to those lists.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — TanStack Query; `data-automation-id` `{domain}-{page}-{element}`
- `../mentorhub_spa_utils/README.md` — **List cards:** Discovery hosts CardGrid dashboards including **events**; `JOURNEY_APP_PATHS.events` → `buildJourneyUrl('discovery', 'events')` → `/discovery/events`; hamburger `nav-events-link` is authenticated (any role)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — home, members, resources, paths, plans, products, notifications, `/config` (F027)
- `src/api/client.ts` / `src/api/types.ts` / `src/api/client.test.ts` — typed list GETs with `offset`/`size` headers and `/discovery/api` prefix
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts` — `CardListSource` map
- `src/pages/DiscoveryHomePage.vue` — shared CardGrid page parameterized by `meta.cardSource`

**Definitive OpenAPI** from the running API (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). Confirm `GET /api/cards/events` (Card array, `offset`/`size` headers). If the live spec includes a `name` query like other typed lists, wire Search by Name the same way as members/resources/paths/plans/products. If it does not, keep the request pagination-only and do not invent `name=`.

Reuse the existing CardGrid + `DiscoveryCard` page. Pagination defaults `offset=0`, `size=20`. First page is enough.

**External prerequisite**: Discovery API already serves the Events card list. Do not read other sibling repositories for schemas.

**Out of scope**: Cypress `nav-events-link` click-through and empty-grid visit (F029). Local CardGrid extraction (F030). Notification Cancel (F032). Do not add a New Event button unless the live product already has a create pattern for events on this page — this issue does not ask for one.

## Goals

- API client has a typed `getEventCards` (name it to match existing `get*Cards` methods) against `GET /discovery/api/cards/events` with the same offset/size headers as F010/F018. Unit tests cover the prefixed URL.
- `CardListSource` includes `'events'`. `useCards` query key is `['cards', 'events']` (plus search when applicable).
- Vue route `path: '/events'` (`name` consistent with other lists, `meta.cardSource: 'events'`, `title: 'Events'`, `requiresAuth: true`) renders the shared list page. Public URL is **`/discovery/events`**.
- Loading, empty, and error `data-automation-id`s follow the existing `discovery-{source}-*` pattern (`discovery-events-grid`, `discovery-events-empty`, `discovery-events-search` if search is shown).
- Existing lists still work: home, members, resources, paths, plans, products, notifications. `/config` from F027 stays. No `/discovery/discovery`.
- Search by Name: Events is **not** Home, so if the API supports `name`, show the centered search like other typed lists. Do not add Invite/New collection buttons on Events.
- README lists Events among Discovery CardGrid surfaces and notes hamburger `nav-events-link` targets this SPA route.

### Craftsmanship Expectations

- Prefer one shared list view parameterized by route meta over a copy-pasted Events page.
- Derive the collection path from the same `/api/cards/{collection}` convention as the other typed lists; do not hard-code a second URL scheme.
- Do not pass Events as a local `PageFrame` nav item — the 1.0.1 catalog already includes it.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI fetch for the Events list path; record `info.version` and the exact path/`name` query behavior in **Execution Notes**.
- `npm run test` — new client/composable coverage; existing list and dismiss tests still pass
- `npm run lint`
- `npm run build`

Cypress for `nav-events-link` and the empty Events grid is F029.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/types.ts` — only if the live Card schema requires it
- `src/api/client.ts` / `src/api/client.test.ts` — Events list GET
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts` — `events` source
- `src/router/index.ts` — `/events`
- `src/pages/DiscoveryHomePage.vue` — only if source unions or toolbar conditions need Events (no New/Invite on this page)
- `README.md` — Events list URL

Do not replace `App.vue` chrome. Do not change the spa_utils pin. Do not add `/mentees` or restore Products/Customer hamburger rows locally.

## Execution Notes

- Plan: confirm the live Discovery OpenAPI contract, add the typed Events card request and
  composable source, route `/events` through the shared CardGrid page, update Discovery
  documentation, and run the required unit, lint, and build checks.
- Live OpenAPI fetched from `http://localhost:8397/docs/openapi.yaml` on 2026-09-01.
  `info.version` is `0.3.0`. `GET /api/cards/events` returns the shared `CardArray` response and
  accepts the standard `offset` and `size` request headers. It does **not** define a `name` query
  parameter (its filters are `type` and `profile_id`), so Events remains pagination-only and does
  not show Search by Name.
- Implemented `api.getEventCards()` against `/cards/events`; with the Vite base this resolves to
  `/discovery/api/cards/events`. The client test matrix verifies the prefixed URL and default
  `offset: 0` / `size: 20` request headers. The existing `Card` schema already includes `Event`, so
  `src/api/types.ts` required no change.
- Added `events` to `CardListSource` and the request map. Events always uses query key
  `['cards', 'events']`; a composable test proves attempted search input neither adds a search key
  nor causes a request with a third argument.
- Added authenticated Vue route `path: '/events'`, name `Events`, title `Events`, and
  `meta.cardSource: 'events'`. It reuses `DiscoveryHomePage`, producing the public route
  `/discovery/events` without duplicating the journey prefix.
- Parameterized the shared page's toolbar visibility so Events renders the existing dynamic
  `discovery-events-loading`, `discovery-events-error`, `discovery-events-empty`, and
  `discovery-events-grid` states without a search field or Invite/New actions. Existing Home,
  typed-list, and Notifications toolbar behavior is unchanged.
- Updated README ownership, routes, CardGrid count, search exceptions, and documented that the
  packaged `nav-events-link` targets `/discovery/events`. `/config` and `/admin` remain unchanged;
  no local PageFrame navigation was added.
- Verification from the SPA repository root:
  - `npm run test` — passed: 11 files, 85 tests.
  - `npm run lint` — passed (`vue-tsc --noEmit`).
  - `npm run build` — passed. Vite emitted the existing non-fatal runtime-config script and
    large-chunk warnings.
  - IDE diagnostics for all changed source/test files — no errors.
- Ready for orchestrator review and commit. Suggested commit:
  `F028: Add Events CardGrid list at /discovery/events`.
