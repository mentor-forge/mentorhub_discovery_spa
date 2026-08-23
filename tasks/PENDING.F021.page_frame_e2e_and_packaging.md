# F021 – PageFrame Cypress coverage and packaging

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F020_card_journey_deep_links`  
**Description**: Point Cypress at spa_utils `PageFrame` automation ids, cover catalog CardGrid routes and `:8080` card/deep-link hrefs, and verify the packaged SPA.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — PageFrame automation ids; Cross-SPA URLs
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/e2e/navigation.cy.ts` — F012/F016 local drawer + `/discovery/` visits
- `cypress/e2e/cards.cy.ts` — F013 card grids
- `src/App.vue` — `PageFrame` (F019)
- `src/router/index.ts` — F018 catalog routes

Use spa_utils ids from `PageFrame` / universal nav (do not invent SPA-local duplicates):

| Id | Role |
| --- | --- |
| `nav-drawer-toggle` | hamburger |
| `page-frame-title` | app-bar title |
| `nav-profile-link` | avatar → `/customer/profile/` |
| `nav-home-link` | Home |
| `nav-notifications-link` | Notifications |
| `nav-customer-link` / `nav-customer-members-link` | customer-gated |
| `nav-resources-link` / `nav-paths-link` / `nav-plans-link` | mentor-gated |
| `nav-products-link` / `nav-settings-link` | admin-gated |
| `nav-logout-link` | built-in logout |

Drop SPA-local drawer selectors from F012 (`nav-discovery-link` and any remaining `to="/..."` drawer ids). Logout still ends at IdP `login.html`.

Cypress runs against **8398**. Compiled hamburger `href`s and F020 card hrefs must include **`:8080`** when the page is served from the Vite/debug port.

## Goals

- Navigation spec: login, open drawer via `nav-drawer-toggle`, see `page-frame-title`, `nav-home-link`, `nav-notifications-link`, `nav-logout-link`. Profile link `href` contains `/customer/profile/` and `:8080` (when on 8398).
- Role-gated items: mentor login shows resources/paths/plans; customer login shows customer + members; admin login shows products + settings; empty/mentee-only roles show Home + Notifications (and not mentor/admin catalog rows).
- Drawer `href`s are absolute ALB URLs (contain `:8080` from debug origin), not Vue `to` paths alone.
- Visit CardGrid routes: `/discovery/`, `/discovery/members/`, `/discovery/resources`, `/discovery/paths`, `/discovery/plans`, `/discovery/products`, `/discovery/notifications` (empty grid OK). Still cover `/discovery/admin` if that Vue route remains.
- Card/deep-link `href`s on a fixture card that targets another journey include `:8080` and the owning prefix (`/customer/`, `/admin/`, `/mentor/`, or `/mentee/`). External resource `http(s)` links may stay as-is.
- No `/discovery/discovery` in `cy.url()` or `href`.
- Existing card markdown / type / dismiss coverage from F013 still passes (prefixed `/discovery/api/...` intercepts).

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed
- `npm run cypress:run`

**Packaging verification** (required for this last F-DS03 task):

- `npm run container`
- `npm run service`
- `npm run cypress:run`
- Spot-check: `http://localhost:8398/discovery/` shows `PageFrame` chrome; hamburger Home href is welcome/ALB, not `:8398`.

Record results in **Execution Notes**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `cypress/e2e/navigation.cy.ts` — PageFrame ids, role-gated hrefs, `:8080`
- `cypress/e2e/cards.cy.ts` — catalog routes + card href `:8080` when applicable
- `cypress/fixtures/**` — only if intercepts need Card `link` values

Do not restore a local drawer. Do not change the spa_utils pin. Do not add new/create buttons.

## Execution Notes

*(Reserved for the task execution agent.)*
