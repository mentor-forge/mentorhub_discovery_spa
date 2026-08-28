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

## Architecture Overview

```
src/
  api/              # API client layer (types.ts, client.ts)
  pages/            # Route-level components (shared Discovery card grid, AdminPage)
  composables/      # App-specific composables (useConfig, useRoles wrapper); auth from spa_utils
  stores/           # Pinia stores (UI state only)
  router/           # Vue Router configuration
  plugins/          # Vuetify plugin configuration
```

**Note**: This SPA uses `@mentor-forge/mentorhub_spa_utils` **1.0.0** for reusable components, composables, and utilities. See the [mentorhub_spa_utils README](../mentorhub_spa_utils/README.md) for complete documentation.

## Key Implementation Patterns

### Authentication
- JWT tokens stored in localStorage (`access_token`, `token_expires_at`)
- Auth (`useAuth`, `redirectToIdpLogin`, `bootstrapAuthFromUrl`) from `@mentor-forge/mentorhub_spa_utils`; see `src/initAuth.ts`
- Sign-in uses IdP / URL hash (`bootstrapAuthFromUrl` from spa_utils); APIs are not used as a login surface
- Router guards protect routes requiring authentication

### Layout and navigation
- The root layout uses `PageFrame` from `@mentor-forge/mentorhub_spa_utils` 1.0.0 as the shared app bar, role-gated navigation drawer, profile link, and logout shell.
- Discovery passes `pageTitle="Discovery"` and renders its router view in the default slot. The universal navigation catalog and cross-SPA links are owned by spa_utils, not configured locally.

### API Client
- Located in `src/api/client.ts`
- Builds its API root from Vite's base URL, so app requests use `/discovery/api/`
  through the SPA nginx proxy
- All API calls include JWT token from localStorage
- Error handling via `ApiError` class; 401 triggers IdP redirect
- Type-safe with TypeScript interfaces in `src/api/types.ts`

### Routes
- `/` — composite Home card grid from `GET /discovery/api/cards`
- `/members` (also `/members/`) — member cards
- `/resources` — learning Resource cards
- `/paths` — learning Path cards
- `/plans` — encounter Plan cards
- `/products` — product cards
- `/notifications` — notification cards
- `/admin` — existing configuration page for users with the `admin` role

All seven list routes share one CardGrid page and load the first 20 cards using `offset` and `size` request headers. Notification cards on the Home and Notifications grids can be dismissed.

### Search and Action Toolbar
- **Search by Name**: All non-home CardGrid lists (`/members`, `/resources`, `/paths`, `/plans`, `/products`, `/notifications`) provide a centered, 300ms-debounced Search by Name input (`ListPageSearch`). The Home composite dashboard (`/`) remains pagination-only and omits the search control.
- **Home Invites**: The Home toolbar displays right-aligned invitation actions based on caller roles:
  - `Invite Member` (visible when roles contain `coordinator`) → Customer SPA members create page (`/customer/members/`)
  - `Invite Coordinator` (visible when roles contain `customer`) → Customer SPA coordinators create page (`/customer/coordinators/`)
- **Collection Create**: Typed catalog pages provide right-aligned create buttons for mentors:
  - `New Resource` (on `/resources` when roles contain `mentor`) → Mentor SPA resources create page (`/mentor/resources/`)
  - `New Path` (on `/paths` when roles contain `mentor`) → Mentor SPA paths create page (`/mentor/paths/`)
  - `New Plan` (on `/plans` when roles contain `mentor`) → Mentor SPA plans create page (`/mentor/plans/`)
- All cross-SPA create and invite hrefs use the standard `buildJourneyUrl` ALB create pattern (`/{journey}/{domain}/` with trailing slash, no `/new` segment).

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

### E2E Tests
- Uses Cypress for end-to-end testing
- Run tests: `npm run cypress` (interactive) or `npm run cypress:run` (headless)

## Automation Support

All interactive elements in this SPA include `data-automation-id` attributes following the `{domain}-{page}-{element}` naming convention.

## CI

`.github/workflows/docker-push.yml` builds and pushes the container image. Registry credentials and dependency policy for your org live in SRE / standards docs, not in this README.

## Configuration
- Runtime configuration for the app is available at `/discovery/api/config`
- Docker container uses `API_HOST` and `API_PORT` environment variables for API proxy configuration
- Container listens on port 80 internally; map host port **8398** to container port 80
- Dev server: `http://localhost:8398/discovery/`; discovery API proxy target: `http://localhost:8397`
- The SPA nginx proxies both `/discovery/api/` (welcome/prefixed traffic) and `/api/` (direct-port debugging) to the Discovery API.
- This container serves only the Discovery journey. It is not an edge router and does not proxy other journey SPAs or their APIs.
