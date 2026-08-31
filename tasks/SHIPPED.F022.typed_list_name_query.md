# F022 – Typed card-list client: optional `name` contains query

**Status**: Shipped  
**Type**: Feature  
**Depends On**: none  
**Description**: Extend typed Card list client methods so non-home lists can send the OpenAPI `name` contains query. Home `GET /api/cards` stays pagination-only. Do not add Search UI or create buttons in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — list GET is offset/size **headers** + JSON array; filters are query parameters
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts` — typed list methods currently send only `offset` / `size` headers
- `src/api/client.test.ts`
- `src/api/types.ts` — only if a small shared options type is needed
- `src/composables/useCards.ts` — do **not** change query keys or UI in this task; F023 will pass `name`

**Definitive OpenAPI** from the running API (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). If that fetch fails, set **Status** to `Blocked` and stop.

Confirm from the live spec (names below are the expected contract; the served file wins):

| Client method | Path | `name` query |
| --- | --- | --- |
| `getHomeCards` | `GET /api/cards` | **Must not** send `name`. Home is pagination-only. |
| `getMemberCards` | `GET /api/cards/members` | Case-insensitive `contains` on name when documented |
| `getResourceCards` | `GET /api/cards/resources` | same |
| `getPathCards` | `GET /api/cards/paths` | same |
| `getPlanCards` | `GET /api/cards/plans` | same |
| `getProductCards` | `GET /api/cards/products` | same |
| `getNotificationCards` | `GET /api/cards/notifications` | send `name` only if the live spec documents it |

Keep existing `offset` / `size` request headers (defaults `0` / `20`). Do not add `sort_by`, `order`, or other filters in this issue. Do not client-side-filter in the API module.

**Out of scope**: Vue pages, `ListPageSearch`, role-gated create buttons, Cypress, README product copy.

## Goals

- Each typed list method (members, resources, paths, plans, products, and notifications if documented) accepts an optional `name` string after the pagination arguments, or a small options object that includes `name`. Empty / whitespace-only `name` omits the query parameter entirely (URL has no `name=`).
- When `name` is present, the request URL includes `?name=` with the trimmed value (percent-encoded). Pagination headers are unchanged.
- `getHomeCards` has no `name` argument and never appends a `name` query. Existing unfiltered calls still work.
- Unit tests cover: default unfiltered typed GET (no `?name=`), a non-empty `name` on a typed list, trimming/omission of blank `name`, and home remaining `/discovery/api/cards` with only pagination headers.
- Record in **Execution Notes** which live typed-list operations document `NameContainsQuery` / `name`. If notifications (or any other mounted typed list) does **not** document `name`, do not send it for that method and note the gap so F023 can fall back to a page-local contains filter for that source only.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm the OpenAPI fetch; record supported `name` query operations in **Execution Notes**.
- `npm run test` — `src/api/client.test.ts` covers the new query-parameter cases; existing list and dismiss tests still pass
- `npm run lint`
- `npm run build`

No Cypress or packaging in this task.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/client.ts` — optional `name` on typed list GETs; home unchanged
- `src/api/client.test.ts` — name query coverage
- `src/api/types.ts` — only if a shared request-options type is introduced

Do not change pages, composables, router, or Cypress.

## Execution Notes

- Live OpenAPI verification against running Discovery API (`http://localhost:8397/docs/openapi.yaml`):
  - Operations documenting `NameContainsQuery` (`name` query param):
    - `getResourceCards` (`GET /api/cards/resources`)
    - `getPathCards` (`GET /api/cards/paths`)
    - `getPlanCards` (`GET /api/cards/plans`)
  - Operations not documenting `name`:
    - `getHomeCards` (`GET /api/cards`) — pagination only (`offset`, `size` headers).
    - `getNotificationCards` (`GET /api/cards/notifications`) — parameters are `offset`, `size` headers and `sort_by`, `order` query params. `name` is not supported in the API spec, so `getNotificationCards` does not send `name` (F023 handles client-side filtering for notifications).
- Implemented `buildCardPath` in `src/api/client.ts` and updated `getMemberCards`, `getResourceCards`, `getPathCards`, `getPlanCards`, `getProductCards` to accept optional `name?: string`.
- Added unit tests in `src/api/client.test.ts` covering:
  - Query parameter encoding and trimming
  - Empty string, whitespace-only, and undefined omission
  - `getHomeCards` remaining pagination-only
- Verification results:
  - `npm run test`: 10 test files passed (70 tests total)
  - `npm run lint`: passed cleanly
  - `npm run build`: built production bundle successfully
