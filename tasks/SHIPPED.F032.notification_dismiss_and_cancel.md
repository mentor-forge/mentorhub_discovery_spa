# F032 – Notification Dismiss and Cancel POST actions

**Status**: Shipped
**Type**: Feature
**Depends On**: `F031_card_icon_type_hints`
**Description**: Wire Notification card buttons to notification POST mutations: **Cancel** when roles contain `admin`, otherwise **Dismiss**. The two controls are mutually exclusive. Stop click-through on both. Invalidate card queries on success.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — least-privileged as well as privileged roles; negative authorization in the UI
- `../mentorhub_spa_utils/README.md` — `useRoles` / `hasRole`; do not pass role tables into `PageFrame`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts` / `src/api/types.ts` / `src/api/client.test.ts` — `POST /discovery/api/notification/dismiss/{id}` already exists
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts` — dismiss mutation + `['cards']` invalidation
- `src/composables/useRoles.ts` — `hasRole('admin')`
- `src/components/DiscoveryCard.vue` — today every Notification shows dismiss and emits `dismiss`
- `src/pages/DiscoveryHomePage.vue` — `handleDismiss`

**Definitive OpenAPI** from the running API (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). Confirm:

- Cancel path: expected `POST /api/notification/cancel/{notification_id}` (mirror dismiss: no body, `200` Notification). Use the live spec path; do not invent a body or a different verb.
- Live `Card` does **not** include `profile_id` (`additionalProperties: false`). Do **not** add `Card.profile_id`. Dismiss vs Cancel is role-gated only.

**Button rules** (Notification cards only):

| Control | When visible | Mutation |
| --- | --- | --- |
| Cancel | caller `roles` contains `admin` | cancel POST |
| Dismiss | caller is **not** admin | existing dismiss POST |

Exactly one control on a Notification card: admin sees Cancel only; non-admin sees Dismiss only. Do not show both. Omit disabled stubs. Non-Notification cards have neither. Both buttons `click.stop` so `card.link` is not followed.

**External prerequisite**: Discovery API already serves notification cancel. Do not read other sibling repositories for schemas.

**Out of scope**: Home auto-follow (F033). Cypress (F034). Do not change PageFrame. Do not gate on `profile_id` (live Card has no such field).

## Goals

- Client exposes `cancelNotification(notificationId)` against the live cancel path under `/discovery/api/...`. Unit tests cover URL, method, auth header, and 401 like dismiss.
- `useCards` exposes a cancel mutation that invalidates `['cards']` on success (same as dismiss).
- `DiscoveryCard` shows Cancel iff `hasRole('admin')`, otherwise Dismiss, for Notification cards only. Stable ids: keep `discovery-card-{id}-dismiss-button`; add `discovery-card-{id}-cancel-button`.
- Page wires dismiss and cancel, surfaces mutation errors without following the card link, and does not call the API from the presentational card (emit + parent mutation, or equivalent, matching today’s dismiss split).
- Unit tests prove the failure modes, not only the happy path:
  - Admin Notification → **Cancel**, **no** Dismiss
  - Non-admin Notification → **Dismiss**, **no** Cancel
  - Non-Notification card → neither control
  - Clicking either control does not open `link`

### Craftsmanship Expectations

- UI gating is not proof of API authorization; still call the API only for the control the UI shows.
- Prefer extending `useCards` over a second notifications composable.
- Do not invent `Card.profile_id` or parse JWT locally for this gate — `hasRole('admin')` is the authority.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI cancel path; record in **Execution Notes**.
- `npm run test` — client, useCards, DiscoveryCard (and page helper if extracted)
- `npm run lint`
- `npm run build`

Cypress dismiss + cancel intercepts are F034. Existing dismiss E2E uses a non-admin-or-default login; keep unit fixtures aligned with role-only gating so later E2E is not surprising.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/client.ts` / `src/api/client.test.ts` — cancel POST
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts`
- `src/components/DiscoveryCard.vue` / `src/components/DiscoveryCard.test.ts`
- `src/pages/DiscoveryHomePage.vue` — cancel handler + error display (reuse or sibling the dismiss error alert)
- `README.md` — Dismiss vs Cancel rules (admin Cancel, otherwise Dismiss)

Do not add `Card.profile_id`. Do not add home auto-follow. Do not change CardGrid layout. Do not change the spa_utils pin.

## Execution Notes

- Prior block (2026-09-01): live OpenAPI `0.3.0` `Card` has no `profile_id` (`additionalProperties: false`), so a profile-match Dismiss gate could not be implemented. Cancel path `POST /api/notification/cancel/{notification_id}` was confirmed. Token `config.token.profile_id` exists but is unused after the role-only rule change.
- Unblocked by product decision: admin → Cancel only; otherwise Dismiss only. No `Card.profile_id` required.
- Implemented the role-only controls: admin Notification cards emit Cancel only; non-admin Notification cards emit Dismiss only; non-Notification cards emit neither. Both action clicks stop card-link navigation.
- Added `cancelNotification` to the Discovery client and `useCards`, including `['cards']` invalidation and page-level mutation error rendering.
- Live OpenAPI `0.3.0` confirmed `POST /api/notification/cancel/{notification_id}` with no request body and a `200` Notification response.
- Verification completed 2026-09-01:
  - `npm run test` — passed (12 files, 103 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed (existing Vite runtime-config and chunk-size warnings only).
