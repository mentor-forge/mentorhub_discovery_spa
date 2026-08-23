# F010 – Card list and Notification dismiss API client

**Status**: Shipped
**Type**: Feature  
**Depends On**: none  
**Description**: Align Discovery SPA types and the API client with the running Discovery API Card-list and Notification-dismiss contract so later tasks can load grids and dismiss Notification cards.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts`
- `src/api/types.ts`
- `src/api/client.test.ts`

**External prerequisite**: The Discovery API already serves Card arrays and Notification dismiss. Do not read other sibling repositories for schemas.

**Definitive OpenAPI** comes from the **running API**. Start it if needed (`npm run api`), then:

```bash
curl -X GET "http://localhost:8397/docs/openapi.yaml"
```

If that fetch fails, set **Status** to `Blocked` and stop. Confirm these operations and shapes from the live spec (names below are the expected contract; the served file wins):

| SPA route (later tasks) | Method and path | Response |
| --- | --- | --- |
| `/` | `GET /api/cards` | JSON **array** of `Card` (composite home list) |
| `/resources` | `GET /api/cards/resources` | `Card[]` |
| `/paths` | `GET /api/cards/paths` | `Card[]` |
| `/plans` | `GET /api/cards/plans` | `Card[]` |

| Mutation | Method and path | Response |
| --- | --- | --- |
| Dismiss notification | `POST /api/notification/dismiss/{notification_id}` | Notification document (`dismissed` breadcrumb) |

List GETs use request headers `offset` (default `0`) and `size` (default `20`, max `100`). The body is a bare array — no cursor envelope and no pagination response headers.

Expected `Card` properties (confirm against the live spec): `_id`, `name` (title), `description` (markdown body), `link` (URI opened on click), `type` (discriminator). `type` values include `Event`, `Member`, `Mentee`, `Notification`, `Path`, `Plan`, and `Resource`. Enumerator **labels** at runtime still come from `GET /api/config`, not from hard-coded OpenAPI copies in the UI.

This task does not add Vue pages, routes, or CardGrid UI.

## Goals

- `src/api/types.ts` includes a `Card` type (and a Notification type if the dismiss `200` body is used) aligned to the fetched OpenAPI.
- `api` exposes typed list methods for home, resources, paths, and plans that:
  - Call the matching `/cards` paths under the existing `/api` prefix.
  - Send `Authorization: Bearer` as today’s client does.
  - Pass `offset` and `size` as **request headers** (defaults `0` / `20`).
  - Return `Card[]`.
- `api` exposes `dismissNotification(notificationId)` that `POST`s the dismiss path with no body and returns the live-spec success payload.
- Existing `getConfig()` behavior is unchanged.
- Client unit tests cover the new methods (URL, method, headers, array body, dismiss path) and keep the existing 401 redirect coverage.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI fetch succeeded; record the served `info.version` and the exact Card/dismiss paths in **Execution Notes**.
- `npm install` — refresh dependencies if lockfile/types change (run `mh` first for CodeArtifact).
- `npm run test` — `src/api/client.test.ts` covers the new Card list and dismiss calls; 401 handling still passes.
- `npm run lint`
- `npm run build`

Do not add Vue pages in this task. Packaging and Cypress belong to later tasks.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/types.ts` — `Card` (and Notification if needed for dismiss)
- `src/api/client.ts` — list GETs + dismiss POST, `offset`/`size` headers
- `src/api/client.test.ts` — unit coverage for the new methods

The agent must not update files outside this list.

## Execution Notes

- Plan:
  1. Fetch the definitive OpenAPI document from the running Discovery API and record its version and Card/Notification operations.
  2. Align the API types and client methods with the live schemas, paths, pagination headers, and dismiss response.
  3. Add focused unit coverage for all list methods, default/custom headers, authorization, response arrays, dismiss POST behavior, and existing 401 handling.
  4. Run the required unit tests, lint, and build; record results and any follow-ups.
- Live OpenAPI:
  - Fetch succeeded from `http://localhost:8397/docs/openapi.yaml`; the API was already running.
  - `info.version`: `0.2.0`.
  - Card paths: `GET /api/cards`, `GET /api/cards/resources`, `GET /api/cards/paths`, and `GET /api/cards/plans`.
  - Dismiss path: `POST /api/notification/dismiss/{notification_id}` with no request body and a `Notification` response.
  - List operations use `offset` and `size` request headers with defaults `0` and `20`; successful responses are bare `Card[]` arrays.
- Implementation:
  - Added live-spec `Card`, `CardType`, `Breadcrumb`, and `Notification` types.
  - Added typed home/resource/path/plan list methods with authorization and pagination headers.
  - Added typed Notification dismiss support and unit coverage for URLs, methods, authorization, default/custom pagination headers, array responses, no-body POST behavior, and existing 401 handling.
- Commands and results:
  - `curl -fsS -X GET "http://localhost:8397/docs/openapi.yaml"` — passed.
  - Live OpenAPI operation inspection via `curl` and Python — passed.
  - `npm run test` — passed: 5 test files, 23 tests.
  - `npm run lint` — passed.
  - `npm run build` — passed; Vite emitted its existing chunk-size advisory.
  - `mh` / `npm install` — not run because dependencies and the lockfile did not change.
- Follow-ups: None for F010. Task is ready for orchestrator confirmation and commit; status intentionally remains `Running`.
