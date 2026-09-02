# F032 – Notification Dismiss and Cancel POST actions

**Status**: Blocked
**Type**: Feature
**Depends On**: `F031_card_icon_type_hints`
**Description**: Wire Notification card buttons to notification POST mutations: **Dismiss** when `notification.profile_id` equals `config.token.profile_id`, and **Cancel** when roles contain `admin`. Stop click-through on both. Invalidate card queries on success.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — least-privileged as well as privileged roles; negative authorization in the UI
- `../mentorhub_spa_utils/README.md` — `useRoles` / `hasRole`; do not pass role tables into `PageFrame`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts` / `src/api/types.ts` / `src/api/client.test.ts` — `POST /discovery/api/notification/dismiss/{id}` already exists; Notification already has `profile_id` and `cancelled`
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts` — dismiss mutation + `['cards']` invalidation
- `src/composables/useConfig.ts` — runtime `GET /discovery/api/config` including `token`
- `src/composables/useRoles.ts` — `hasRole('admin')`
- `src/components/DiscoveryCard.vue` — today every Notification shows dismiss and emits `dismiss`
- `src/pages/DiscoveryHomePage.vue` — `handleDismiss`

**Definitive OpenAPI** from the running API (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). Confirm:

- Card (or Notification-on-card) field used for the target profile — issue language is `notification.profile_id`. If the Card schema includes `profile_id`, add it to `Card`. Do not guess a different claim.
- Cancel path: expected `POST /api/notification/cancel/{notification_id}` (mirror dismiss: no body, `200` Notification). Use the live spec path; do not invent a body or a different verb.
- Token shape for `config.token.profile_id` versus `config.token.claims.profile_id` — compare against whatever `GET /api/config` actually returns (Admin Token tab reads claims via spa_utils). Record the chosen path in **Execution Notes**.

**Button rules** (Notification cards only):

| Control | When visible | Mutation |
| --- | --- | --- |
| Dismiss | `profile_id` on the notification/card **equals** runtime config token `profile_id` | existing dismiss POST |
| Cancel | caller `roles` contains `admin` | cancel POST |

Both may appear together (admin viewing their own notification). Omit the control when the condition is false — do not render disabled stubs. Non-Notification cards have neither. Both buttons `click.stop` so `card.link` is not followed.

**External prerequisite**: Discovery API already serves notification cancel. Do not read other sibling repositories for schemas.

**Out of scope**: Home auto-follow (F033). Cypress (F034). Do not change PageFrame.

## Goals

- Client exposes `cancelNotification(notificationId)` against the live cancel path under `/discovery/api/...`. Unit tests cover URL, method, auth header, and 401 like dismiss.
- `useCards` exposes a cancel mutation that invalidates `['cards']` on success (same as dismiss).
- `DiscoveryCard` shows Dismiss iff the profile match holds, Cancel iff `hasRole('admin')`. Stable ids: keep `discovery-card-{id}-dismiss-button`; add `discovery-card-{id}-cancel-button`.
- Page wires dismiss and cancel, surfaces mutation errors without following the card link, and does not call the API from the presentational card (emit + parent mutation, or equivalent, matching today’s dismiss split).
- Unit tests prove the failure modes, not only the happy path:
  - Notification whose `profile_id` is missing or differs from the token → **no** Dismiss
  - Non-admin → **no** Cancel
  - Admin + matching profile → both
  - Matching profile + non-admin → Dismiss only
  - Clicking either control does not open `link`

### Craftsmanship Expectations

- UI gating is not proof of API authorization; still call the API only for the controls the UI shows, and keep using the token/config already loaded at app start.
- Do not duplicate JWT parsing; read `profile_id` from the same config object Admin/Token already uses once the live shape is confirmed.
- Prefer extending `useCards` over a second notifications composable.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI cancel path and Card/`profile_id` field; record in **Execution Notes**.
- `npm run test` — client, useCards, DiscoveryCard (and page helper if extracted)
- `npm run lint`
- `npm run build`

Cypress dismiss + cancel intercepts are F034. Existing dismiss E2E will break if Dismiss is hidden without `profile_id` on the fixture — F034 updates that fixture; this task should keep unit fixtures’ `profile_id` aligned so later E2E is not surprising.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/types.ts` — `Card.profile_id` (or documented equivalent from live spec)
- `src/api/client.ts` / `src/api/client.test.ts` — cancel POST
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts`
- `src/components/DiscoveryCard.vue` / `src/components/DiscoveryCard.test.ts`
- `src/pages/DiscoveryHomePage.vue` — cancel handler + error display (reuse or sibling the dismiss error alert)
- `README.md` — Dismiss vs Cancel rules

Do not add home auto-follow. Do not change CardGrid layout. Do not change the spa_utils pin.

## Execution Notes

- 2026-09-01 contract verification:
  - Live `POST /api/notification/cancel/{notification_id}` takes no request body and returns
    `200` with a `Notification`.
  - Authenticated live `GET /api/config` returns the profile claim at
    `config.token.profile_id` (directly on `token`, not under `token.claims`).
  - Live `Card` has no `profile_id` property and declares `additionalProperties: false`.
    Every `GET /api/cards*` response is documented as an array of that `Card` schema, including
    Notification cards. The separate `Notification` schema has `profile_id`, but the API exposes
    Notification reads to this SPA only through the Card endpoints.
- Blocked before implementation: the required Dismiss visibility rule cannot be implemented from
  the live response contract without guessing or violating the instruction not to add a field that
  is absent from live `Card`. The Discovery API contract/projection must first expose
  `profile_id` on Notification cards (and add it to `Card`) or expose a documented equivalent.
  No SPA source or test changes were made, and test/lint/build were not run because the required
  contract prerequisite is not satisfied.
- Orchestrator halt (2026-09-01): independently re-fetched live OpenAPI `0.3.0` from
  `http://localhost:8397/docs/openapi.yaml`. Confirmed `Card` properties are `_id`, `name`,
  `description`, `link`, `type` with `additionalProperties: false`; cancel route exists as
  `POST /api/notification/cancel/{notification_id}`. F033 and F034 were not started.
