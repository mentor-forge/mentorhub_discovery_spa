# F010 – Card list and Notification dismiss API client

**Status**: Pending  
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

*(Reserved for the task execution agent.)*
