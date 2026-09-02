# F034 – Card updates Cypress coverage, README, and packaging

**Status**: Shipped
**Type**: Feature
**Depends On**: `F033_home_single_card_auto_follow`
**Description**: Cover local CardGrid layout, type-icon hover, Notification Dismiss/Cancel gating, and Home single-card auto-follow in Cypress. Verify the packaged SPA. This is the last task of the F-DS05 card-updates set.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; least-privileged and privileged roles; assert the real browser path
- `../mentorhub_spa_utils/README.md` — PageFrame ids; Cross-SPA URLs (`:8080` from debug origin except Settings)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/e2e/cards.cy.ts` — F029 Events empty route, existing dismiss spec, F025 search/actions
- `cypress/e2e/navigation.cy.ts` — F029 1.0.1 catalog (keep passing)
- `src/components/CardGrid.vue` — local (F030)
- `src/components/DiscoveryCard.vue` — icon padding/tooltip (F031); Dismiss/Cancel (F032)
- `src/pages/DiscoveryHomePage.vue` — auto-follow (F033)

Cypress runs against **8398**. Intercept Discovery API as today (`**/discovery/api/...`). Do **not** visit Customer or Mentor SPAs; assert composed `href`s / `window.open` only.

F029 catalog/config/events specs must still pass. F025 search and Invite/New specs must still pass.

## Goals

- **Layout:** On a Home (or Resources) intercept with several cards of unequal body length, cards in the same visual row have equal computed height. At a viewport wide enough for 3+ columns, card used width fills the track (no leftover max-width as if it were still a 1–2 column card). Skip a brittle pixel assertion if needed, but do not skip both height and width.
- **Icon:** Type icon still has `discovery-card-{id}-type-icon`. Hover/focus shows the card type (tooltip or equivalent). Spot-check at least two types from the F031 table (e.g. Resource + Event).
- **Dismiss:** Non-admin login shows `discovery-card-{id}-dismiss-button` on a Notification and **not** Cancel. Click `POST`s `/discovery/api/notification/dismiss/{id}`, does not follow `link`, and the card leaves the grid. An admin login has **no** dismiss button.
- **Cancel:** Admin login shows `discovery-card-{id}-cancel-button` on a Notification and **not** Dismiss. Click `POST`s `/discovery/api/notification/cancel/{id}` (live path from F032), does not follow `link`, and the card leaves the grid after invalidation. A non-admin login does **not** show Cancel.
- **Auto-follow:** Home intercept with **exactly one** linked card causes navigation to that `cardHref` (`:8080` journey URL when applicable). Home intercept with **two** cards does not auto-navigate (grid remains). Stub `window.open` when that is how F033 navigates.
- F029 empty Events / config / catalog navigation still pass. No `/discovery/discovery`.

### Craftsmanship Expectations

- Prove the UI gates wrong: admin must not dismiss; non-admin must not cancel; two Home cards must not auto-follow.
- Assert POST paths on the network, not only button visibility.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed
- `npm run cypress:run`

**Packaging verification** (required — last task of the F-DS05 set):

- `npm run container`
- `npm run service`
- `npm run cypress:run`

Record results in **Execution Notes**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/cards.cy.ts` — layout, icon hint, role-gated dismiss vs cancel, Home auto-follow (or a new `cypress/e2e/*.cy.ts` if splitting keeps the file readable; then list it here)
- `cypress/fixtures/**` — only if intercepts need extra fixtures
- `cypress/e2e/navigation.cy.ts` — only if a catalog regression is found
- `README.md` — only if E2E notes omit the new card behaviors

Do not restore spa_utils `CardGrid`. Do not restore a local drawer. Do not change the spa_utils pin.

## Execution Notes

- Plan: extend `cypress/e2e/cards.cy.ts` with wide-grid computed layout checks,
  Resource/Event type tooltip checks, exclusive role-gated Notification actions
  with POST/refetch/no-navigation assertions, and one-card versus two-card Home
  auto-follow coverage. Then run unit tests, lint, build, container packaging,
  packaged service startup/health verification, and the complete Cypress suite.
- Implemented Cypress coverage for a 1440px responsive grid (4 computed columns,
  equal first-row heights, and both the DiscoveryCard wrapper and MhCard filling
  each track), Resource/Event tooltip text, exclusive non-admin Dismiss and admin
  Cancel actions with exact POST paths/refetch/removal/no-navigation, and Home
  one-card auto-follow versus two-card no-follow behavior.
- Isolated navigation catalog specs from live Home card data so F033 auto-follow
  cannot detach PageFrame controls during unrelated drawer assertions.
- `npm run test`: PASS — 13 files, 120 tests.
- `npm run lint`: PASS.
- `npm run build`: PASS — Vite production build completed (existing runtime-config
  script and large-chunk warnings only).
- `npm run container`: PASS — Docker image
  `ghcr.io/mentor-forge/mentorhub_discovery_spa:latest` built successfully
  (existing Docker JSON-form CMD recommendation only).
- `npm run service`: PASS — `mh down`, `mh up discovery`, and `npm run open`
  completed; `http://localhost:8398/discovery/` passed an HTTP health check.
- `npm run cypress:run`: PASS after correcting tooltip overlay selection and
  isolating drawer specs from Home auto-follow — 3 specs, 34 tests, 34 passing,
  0 failing, 0 pending, 0 skipped. Breakdown: cards 19/19, deployment 8/8,
  navigation 7/7.
- Task filename intentionally remains `PENDING.*`; no commit or push performed.
