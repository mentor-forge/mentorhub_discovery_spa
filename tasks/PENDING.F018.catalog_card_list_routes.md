# F018 – Catalog CardGrid routes: members, products, notifications

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F017_pin_spa_utils_1_0_0`  
**Description**: Add Discovery CardGrid list pages for `members/`, `products`, and `notifications` so Vue routes match spa_utils `JOURNEY_APP_PATHS`. Keep existing home / resources / paths / plans / admin. Do not adopt `PageFrame` yet; do not add deferred new buttons.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **List cards:** Discovery is the only journey SPA that hosts CardGrid dashboards (home, members, resources, paths, plans, products, notifications); `JOURNEY_APP_PATHS`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — after F012/F014: `/`, `/resources`, `/paths`, `/plans`, `/admin` under Vite base `/discovery/`
- `src/api/client.ts` — F010/F016 list methods for home/resources/paths/plans only
- `src/composables/useCards.ts` — F012 query helper (filename may be `useCards.ts`)
- `src/pages/**` — shared/parameterized list page from F012
- `src/App.vue` — local drawer still present until F019; **do not** grow a parallel hamburger catalog (PageFrame will own that)

**Definitive OpenAPI** from the running API (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). Expected typed lists (confirm live spec):

| Vue path (base `/discovery/`) | List source | `JOURNEY_APP_PATHS` key |
| --- | --- | --- |
| `/members` (public URL `/discovery/members/`) | `GET /api/cards/members` | `members` (`members/`) |
| `/products` | `GET /api/cards/products` | `products` |
| `/notifications` | `GET /api/cards/notifications` | `notifications` |

Reuse the F012 CardGrid + `DiscoveryCard` pattern (offset/size headers, JSON array). Notification dismiss on the notifications list (and home) stays the F010 mutation.

Do **not** add `/mentees`, `/customer`, or `/settings` as Discovery Vue routes. Settings in the universal catalog is the Admin SPA (`/admin/settings`). Keep local `/admin` (AdminPage) as a Vue route; F019 will not put it in the hamburger.

**Out of scope**: `PageFrame` (F019), `buildJourneyUrl` card hrefs (F020), page-level new buttons.

## Goals

- API client has typed list methods for members, products, and notifications (same offset/size headers as F010). Unit tests cover the new URLs under `/discovery/api/cards/...` (F016 `{BASE_URL}api` prefix).
- Vue routes exist for `/members`, `/products`, and `/notifications` (alias `/members/` if needed so the catalog trailing slash does not 404). Each page is a CardGrid list, same empty/loading/error automation pattern as F012.
- Home, resources, paths, plans, and admin still work. No `/discovery/discovery`.
- Local `App.vue` drawer does **not** need new items (F019 `PageFrame` compiled catalog will expose Members / Products / Notifications). Optional: leave the drawer as F012 (home/resources/paths/plans/admin/logout) so F019 has a clean delete.
- README lists the full Discovery CardGrid surfaces: home, members, resources, paths, plans, products, notifications (plus `/admin` for local config).

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI fetch for the three typed list paths; record in **Execution Notes**.
- `npm run test` — new client/composable coverage
- `npm run lint`
- `npm run build`

Cypress for the new routes is F021 (after PageFrame). A smoke visit in F018 is optional, not required.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/types.ts` — only if new types are needed
- `src/api/client.ts` / `src/api/client.test.ts` — members/products/notifications list GETs
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts` — query keys for the new lists
- `src/router/index.ts` — three routes
- `src/pages/**` — shared list page meta or thin wrappers
- `README.md` — catalog list URLs

Do not replace `App.vue` chrome. Do not add new/create buttons.

## Execution Notes

*(Reserved for the task execution agent.)*
