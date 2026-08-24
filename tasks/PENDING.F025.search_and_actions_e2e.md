# F025 – Search and create-action Cypress coverage, README, and packaging

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F024_role_gated_create_buttons`  
**Description**: Cover Search by Name and role-gated Invite/New buttons in Cypress, document the toolbar in the README, and verify the packaged SPA.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — E2E covers pages; automation ids are a stable UI API
- `../mentorhub_spa_utils/README.md` — PageFrame ids; Cross-SPA URLs (`:8080` from debug origin)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/e2e/cards.cy.ts` — F021 catalog routes, empty states, card hrefs, dismiss
- `cypress/e2e/navigation.cy.ts` — PageFrame role-gated drawer (keep passing)
- `src/pages/DiscoveryHomePage.vue` — F023 search + F024 actions
- `src/api/client.ts` — F022 `name` query on typed lists

Cypress runs against **8398**. Intercept Discovery API as today (`**/discovery/api/...`). Do **not** visit Customer or Mentor SPAs; assert composed `href`s only and prevent navigation if a click is used.

Existing F021 empty-grid visits must still pass. Search and action intercepts should not break those tests (empty `name`-less GETs remain valid).

## Goals

- **Search (non-home lists):** Visit at least `/discovery/resources` (and one other typed list such as `/discovery/members/` or `/discovery/paths`). Assert `discovery-{source}-search` is visible and centered above the grid. Home (`/discovery/`) has **no** `discovery-home-search`.
- Typing a name after debounce causes the typed-list GET to include `name` (assert the intercepted URL or query). A matching fixture card remains visible; a miss shows the existing empty-state id. Clearing the field repeats the GET without `name`.
- **Home invites:** `cy.login(['coordinator'])` on `/discovery/` shows `discovery-home-invite-member-button` with href `http://localhost:8080/customer/members/`. `cy.login(['customer'])` shows `discovery-home-invite-coordinator-button` with href `http://localhost:8080/customer/coordinators/`. A login that has both roles shows both. A mentor-only (or mentee-only) login shows neither.
- **New collection:** mentor login on `/discovery/resources`, `/discovery/paths`, and `/discovery/plans` shows the matching New button, right-aligned, with create hrefs `http://localhost:8080/mentor/resources/`, `/mentor/paths/`, `/mentor/plans/` (trailing slash, no `/new`). A non-mentor login on those routes must not show the New buttons. Members / products / notifications must not show Invite or New collection buttons.
- No composed href includes `:8398` or `/discovery/discovery`.
- README documents Search by Name on non-home CardGrid lists and the role-gated Home / collection create actions (Discovery composes hrefs; owning SPAs host the create pages).
- F021 card, dismiss, catalog empty-state, and navigation specs still pass.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed
- `npm run cypress:run`

**Packaging verification** (required for this last task in the set):

- `npm run container`
- `npm run service`
- `npm run cypress:run`

Record results in **Execution Notes**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/cards.cy.ts` — search, Home invites, New collection buttons, `:8080` hrefs (or a new `cypress/e2e/*.cy.ts` if splitting keeps the file readable; then list it here)
- `cypress/fixtures/**` — only if intercepts need named card fixtures
- `README.md` — search and role-gated create actions

Do not restore a local drawer. Do not change the spa_utils pin. Do not add Vue routes.

## Execution Notes

- Reserved for the task execution agent.
