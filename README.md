# Mentor Hub — Discovery SPA

## Current State
Guidance for LLM Code Assistants - NOTE: We are currently pre-release. At this time, no changes should consider backward compatibility. Likewise, while we anticipate versioning releases in the future at this point, no consideration should be given to bumping any versions beyond managing the internal api_utils spa_utils dependencies. We are in a rapid iteration phase where features can be deprecated and removed without pause. When working in this repo we should keep our eyes out for potential re-usable code that could be migrated to spa_utils. This code should be implemented locally, and issues opened in the api_utils repo when it is time to migrate code.

UI Components should stick to Vuetify styling, and leverage re-usable input components from SPA utils when possible. If a spa_utils component need to be updated, the code can be copied to this repo, edited, tested, and migrated to the utils repo like new re-usable components are.

Bootstrapped from `mentorhub_mentee_spa` (F-W18). The authenticated Discovery experience is a set of polymorphic card-grid routes backed by the Discovery API.

## Prerequisites
- Mentor Hub [Developers Edition](https://github.com/mentor-forge/mentorhub/blob/main/CONTRIBUTING.md)
- Developer [SPA Standard Prerequisites](https://github.com/mentor-forge/mentorhub/blob/main/DeveloperEdition/standards/spa_standards.md)

## Quick Start

```sh
## Just run the service
npm run service 
```

Open the Discovery SPA through the Developer Edition welcome origin at
`http://localhost:8080/discovery/`. For direct container debugging, use
`http://localhost:8398/discovery/`.

## Developer Commands

```sh
## install dependencies (run `mh` first for CodeArtifact auth)
npm ci

## install Cypress binaries
npx cypress install

## package code for deployment
npm run build 

## run dev server at http://localhost:8398/discovery/, assumes api is running
npm run dev 

## type-check (lint)
npm run lint

## run unit tests
npm run test:unit

## run unit tests with coverage
npm run test:coverage

## run unit tests with UI
npm run test:ui

## run Cypress E2E tests
npm run cypress

## run Cypress E2E tests headlessly
npm run cypress:run

## de down and start db + api containers
npm run api 

## de down and start db + api + spa containers and open 
npm run service 

## open page in the browser
npm run open

## Build SPA docker container locally (run `mh` first)
npm run container
```

## Architecture Ownership

| Layer | Owns |
|-------|------|
| **This SPA** | Local `CardGrid` layout and collection/list browsing (home, events, members, resources, paths, plans, products, notifications), Discovery page state, Discovery API client, Search by Name / role-gated create toolbar presentation, card deep-link composition |
| **`spa_utils` 1.0.1** | Auth/JWT bootstrap, IdP redirect, `PageFrame` chrome, role-gated hamburger catalog, `buildJourneyUrl` / ALB origin rules, `ListPageSearch`, `MhCard` chrome |
| **Customer / Mentor / Admin / Mentee SPAs** | Detail, edit, and create pages that Discovery cards and Invite/New buttons target |
| **nginx (this container)** | `/discovery/` document prefix, SPA history fallback, `/discovery/api/` → `discovery_api`, dual runtime-config paths, cache headers |
| **Discovery API** | Authorization enforcement, card list filtering, notification dismiss and cancel |

Uses `@mentor-forge/mentorhub_spa_utils` **1.0.1**. Local nav config is disallowed — do not pass `navItems`, URL maps, or ALB origins to `PageFrame`. Cross-SPA hrefs are absolute welcome/ALB `:8080` URLs from `buildJourneyUrl`, never direct debug ports (`:8398`, etc.).

### Prohibited patterns
- Hosting detail/edit/create pages that belong to another journey SPA
- Hard-coding journey prefixes, ALB origins, or debug ports outside `buildJourneyUrl` / `resolveAlbOrigin`
- Baking `IDP_LOGIN_URI` into the Vite build artifact
- Treating UI role gating as proof of API authorization

### Deployment Prefix & Runtime Config Invariants

- Browser document and assets load under `/discovery/` (Vite `base` + nginx rewrite onto a flat dist root).
- HTML and `/discovery/runtime-config.js` / `/runtime-config.js` are `Cache-Control: no-store` (never `immutable`).
- Fingerprinted `/discovery/assets/*` may be `public, immutable`.
- `location ^~ /discovery/api/` wins over the static-asset regex so `/discovery/api/*.js` cannot be cached as an asset.
- Prefixed and root `runtime-config.js` serve the **same** container-generated file for this image. The Discovery SPA must not silently consume another journey's runtime config; the HTML shell must request `/discovery/runtime-config.js`.
- Runtime config is injected at container start from compose `IDP_LOGIN_URI` — it is not baked into the immutable build artifact.
- Supported browser entry: `http://<host>:8080/discovery/`. Direct-port `http://localhost:8398/discovery/` is debugging only. `/` and `/discovery` redirect to `/discovery/`.

## Key Implementation Patterns

### Authentication
- JWT tokens stored in localStorage (`access_token`, `token_expires_at`)
- Auth (`useAuth`, `redirectToIdpLogin`, `bootstrapAuthFromUrl`) from `@mentor-forge/mentorhub_spa_utils`; see `src/initAuth.ts`
- Sign-in uses IdP / URL hash (`bootstrapAuthFromUrl` from spa_utils); APIs are not used as a login surface
- Router guards protect routes requiring authentication

### Layout and navigation
- The root layout uses `PageFrame` from `@mentor-forge/mentorhub_spa_utils` 1.0.1 as the shared app bar, role-gated navigation drawer, profile link, and logout shell.
- Discovery passes `pageTitle="Discovery"` and renders its router view in the default slot. The universal navigation catalog and cross-SPA links are owned by spa_utils, not configured locally.
- The 1.0.1 hamburger catalog contains Home, Events, Resources, Paths, and Plans. Notifications and Settings are admin-only. Settings stays on the hosting origin (with no `:8080` rewrite) and lands on this SPA's `/config` route.
- Discovery owns its local responsive `CardGrid` layout because it is the only
  journey SPA hosting card dashboards. `spa_utils` continues to own `MhCard`,
  `PageFrame`, and `ListPageSearch`.

### API Client
- Located in `src/api/client.ts`
- Builds its API root from Vite's base URL, so app requests use `/discovery/api/`
  through the SPA nginx proxy
- All API calls include JWT token from localStorage
- Error handling via `ApiError` class; 401 triggers IdP redirect
- Type-safe with TypeScript interfaces in `src/api/types.ts`

### Routes
- `/` — composite Home card grid from `GET /discovery/api/cards`
- `/events` — Event cards from `GET /discovery/api/cards/events`; public URL `/discovery/events`
- `/members` (also `/members/`) — member cards
- `/resources` — learning Resource cards
- `/paths` — learning Path cards
- `/plans` — encounter Plan cards
- `/products` — product cards
- `/notifications` — notification cards
- `/config` (also `/admin`) — admin Settings host for the packaged `AdminPage`: Token, Config Items, Versions, and Enumerators

All eight list routes share one CardGrid page and load the first 20 cards using `offset` and `size` request headers. Notification cards on the Home and Notifications grids show exactly one role-gated action: callers with `admin` see **Cancel**, while all other callers see **Dismiss**. Non-Notification cards show neither action. The packaged hamburger's `nav-events-link` targets this SPA's `/discovery/events` route.

After the initial Home query succeeds, a Home result containing exactly one linked card is followed automatically using the same `cardHref` as a card click. This supports the typical mentee experience with no notifications and one mentee card. Other list routes, empty or multi-card Home results, and later Home refetches do not auto-follow.

### Search and Action Toolbar
- **Search by Name**: CardGrid lists with a `name` query provide a centered, 300ms-debounced Search by Name input (`ListPageSearch`). Home and Events remain pagination-only and omit the search control.
- **Typed lists** (`members`, `resources`, `paths`, `plans`, `products`): debounced search becomes an API `?name=` query on `GET /discovery/api/cards/{collection}`. Empty/whitespace search omits `name`.
- **Events** (contract-driven exception): the API has no `name` query, so the Events request stays pagination-only and the page does not show Search by Name.
- **Notifications** (intentional exception): Search by Name filters the already-loaded page **client-side** with a case-insensitive `card.name` contains match. The notifications list request stays pagination-only and must **not** receive `name=`. Do not invent an API filter that the contract does not own.
- **Home Invites**: The Home toolbar displays right-aligned invitation actions based on caller roles:
  - `Invite Member` (visible when roles contain `coordinator`) → Customer SPA members create page (`/customer/members/`)
  - `Invite Coordinator` (visible when roles contain `customer`) → Customer SPA coordinators create page (`/customer/coordinators/`)
- **Collection Create**: Typed catalog pages provide right-aligned create buttons for mentors:
  - `New Resource` (on `/resources` when roles contain `mentor`) → Mentor SPA resources create page (`/mentor/resources/`)
  - `New Path` (on `/paths` when roles contain `mentor`) → Mentor SPA paths create page (`/mentor/paths/`)
  - `New Plan` (on `/plans` when roles contain `mentor`) → Mentor SPA plans create page (`/mentor/plans/`)
- All cross-SPA create and invite hrefs use `createActionHref` → spa_utils `buildJourneyUrl` (`/{journey}/{domain}/` with trailing slash, no `/new` segment). Owning SPAs host those create pages; Discovery only composes the destination.

### Cross-SPA card links
- Discovery remains the only host for the CardGrid list dashboards; Customer, Admin,
  Mentor, and Mentee SPAs own their detail, edit, and create pages.
- Card targets for those pages are composed with spa_utils `buildJourneyUrl`,
  `resolveAlbOrigin`, and `JOURNEY_APP_PATHS`. Direct Vite/debug-port links are
  rewritten through the welcome/ALB origin (`:8080` in Developer Edition).
- Absolute HTTP(S) learning-resource links outside Mentor Hub are kept unchanged.

## Testing

### Unit Tests
- Uses Vitest for unit testing
- Run tests: `npm run test:unit`
- Coverage report: `npm run test:coverage`
- Covers API client (`name` query encoding), `useCards` (debounce, query keys, client-side notification filter, source-change reset, stale-result rejection), and `createActionHref` ALB composition

### E2E Tests
- Cypress against the packaged SPA on `http://localhost:8398` (`npm run service` must be running; do not run `npm run dev` at the same time)
- Prefer `cy.visitPrefixed(...)` over raw `cy.visit` for in-app routes — it asserts `PerformanceNavigationTiming` so a Vue Router rewrite cannot mask an un-prefixed document fetch
- Specs cover CardGrid catalogs, Search by Name (API-backed vs notifications client-side), role-gated Invite/New buttons (positive and negative), spa_utils `PageFrame` chrome, and the nginx deployment boundary (`deployment.cy.ts`: redirects, history fallback, cache headers, dual runtime-config, authenticated and unauthenticated `/discovery/api` proxy)
- UI role gating is UX; API authorization is proven separately via Bearer requests through `/discovery/api/`

## Automation Support

All interactive elements in this SPA include `data-automation-id` attributes following the `{domain}-{page}-{element}` naming convention.

Cypress targets spa_utils `PageFrame` ids for chrome, not local ones:

- Always present when authenticated: `nav-drawer-toggle`, `page-frame-title`, `nav-profile-link`, `nav-home-link`, `nav-events-link`, `nav-logout-link`
- Role-gated examples: `nav-resources-link` (mentor), `nav-notifications-link` / `nav-settings-link` (admin)

Do not define host `nav-*` ids in this SPA.

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- **Supported browser entry**: `http://<host>:8080/discovery/` via Developer Edition welcome / ALB
- **Direct-port debugging only**: `http://localhost:8398/discovery/`; `http://localhost:8398/` and `/discovery` redirect to `/discovery/`
- **API proxy**: client calls `/discovery/api/` (derived from Vite `base`); container nginx proxies to `http://${API_HOST}:${API_PORT}/api/` on `discovery_api` (**8397**). Direct-port `/api/` kept for debugging
- Runtime enumerators come from `GET /discovery/api/config`, not OpenAPI
- Container uses `API_HOST`, `API_PORT`, and `IDP_LOGIN_URI` at startup; same image every environment
- This container serves only the Discovery journey. It is not an edge router and does not proxy other journey SPAs or their APIs.
