# F016 – Prefixed API client, Cypress, and packaging

**Status**: Shipped
**Type**: Feature  
**Depends On**: `F015_nginx_discovery_prefix`  
**Description**: Point the SPA API client at `{BASE_URL}api` so calls from `/discovery/` hit SPA nginx `location /discovery/api/`, update Cypress intercepts/visits, and verify lint, unit tests, Cypress, and the packaged container.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/client.ts` — `API_BASE = '/api'` (absolute root; from `:8080/discovery/` this misses SPA nginx)
- `src/api/client.test.ts` — expects `/api/config` (and F010 card paths)
- `vitest.config.ts` — must see the same Vite `base` as `vite.config.ts` so `import.meta.env.BASE_URL` is `/discovery/`
- `cypress.config.ts` — `baseUrl` stays `http://localhost:8398`
- `cypress/e2e/**/*.cy.ts` — F014 visits `/discovery/...`; intercepts may still be `/api/...`
- `nginx.conf.template` — F015 `/discovery/api/` and leftover `/api/`

**Why this change:** `fetch('/api/...')` from `http://<host>:8080/discovery/` goes to `http://<host>:8080/api/...` (welcome), not this container. Same-origin JWT in `localStorage` only helps if API traffic also stays on the Discovery prefix. Use `import.meta.env.BASE_URL` so there is still **one** build: `{BASE_URL}api` → `/discovery/api`.

Do not maintain a second client or a root-only bundle. Keep nginx `location /api/` for curl/debug; the SPA should not depend on it.

`IDP_LOGIN_URI` remains `http://<HOST_NAME>:8080/login.html`.

## Goals

- `src/api/client.ts` builds the API root from `import.meta.env.BASE_URL` (e.g. `/discovery/api`). All list/config/dismiss calls use that prefix. Leading-slash `/api` is gone from SPA fetches.
- Unit tests expect `/discovery/api/config`, `/discovery/api/cards`, `/discovery/api/cards/resources` (etc.), and `/discovery/api/notification/dismiss/...`. If Vitest does not inherit Vite `base`, set `base: '/discovery/'` in `vitest.config.ts`.
- Cypress `baseUrl` remains `http://localhost:8398`. Visits are `/discovery/`, `/discovery/resources`, `/discovery/paths`, `/discovery/plans`, `/discovery/admin`. Intercepts/fixtures match `/discovery/api/...` (not `/api/...` unless a test is explicitly exercising the debug location).
- Confirm in-app routes are `/discovery/...` and **never** `/discovery/discovery/...`.
- README states API calls from the app use `/discovery/api/` via SPA nginx.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run api` and/or `npm run service` as needed for Cypress
- `npm run cypress:run` — navigation + card-grid specs pass against `http://localhost:8398/discovery/`

**Packaging verification** (required for this last task in the F-DS02 set):

- `npm run container`
- `npm run service`
- `npm run cypress:run`
- Spot-check: `http://localhost:8398/discovery/` is this SPA; a logged-in (or 401) `GET` to `/discovery/api/config` is proxied JSON/error from the API, not `index.html`.
- If welcome is running: `http://localhost:8080/discovery/` is this SPA, not welcome `index.html`. Do not modify other repositories.

Record results in **Execution Notes**.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/client.ts` — `API_BASE` from `import.meta.env.BASE_URL`
- `src/api/client.test.ts` — prefixed fetch URLs
- `vitest.config.ts` — `base: '/discovery/'` if needed
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/cards.cy.ts` (and any other specs/fixtures that stub `/api/`)
- `README.md` — `/discovery/api/` client path

Do not add a second Vite build. Do not add Vue route `/discovery`. Do not change IdP login URI.

Do **not** pin spa_utils 1.0.0, adopt `PageFrame`, or rewrite drawer selectors here (F017–F021). Cypress may keep F012 local nav ids. Catalog list routes `members/`, `products`, and `notifications` remain F018.

## Execution Notes

- Plan: derive the API root from Vite's `import.meta.env.BASE_URL`, configure Vitest
  with the production `/discovery/` base, and update unit/Cypress URL expectations
  plus README API-path documentation.
- Plan: run unit tests, type-check lint, build, and Cypress against the service;
  rebuild the container and repeat service/Cypress verification, then spot-check
  direct and welcome-prefixed routes and confirm no `/discovery/discovery`.
- Implemented: `API_BASE` is now `${import.meta.env.BASE_URL}api`, which resolves
  to `/discovery/api` for this app. Vitest uses `base: '/discovery/'`; unit and
  Cypress expectations use `/discovery/api/...`; README documents the app-facing
  prefixed API path.
- Verification:
  - `npm run test` passed: 9 files, 48 tests.
  - `npm run lint` passed.
  - `npm run build` passed. Vite emitted the existing runtime-config and large
    chunk warnings; generated URLs are `/discovery/...`.
  - Source/Cypress and built-output searches found no `/discovery/discovery`.
  - `npm run service` succeeded before packaging. The first `npm run cypress:run`
    used the pre-F016 local image and failed three card intercept waits because
    that image still requested `/api/...`; navigation passed 5/5.
  - Packaging sequence passed: `npm run container`, `npm run service`, then
    `npm run cypress:run` with 9/9 tests passing.
  - Direct spot-check `http://localhost:8398/discovery/` returned the packaged
    SPA (200), and resources/paths/plans/admin history routes returned 200.
  - `GET http://localhost:8398/discovery/api/config` returned API JSON with
    `401 UNAUTHORIZED` and `Content-Type: application/json`, not `index.html`.
  - Welcome was running; `http://localhost:8080/discovery/` returned the same
    packaged SPA shell and asset hash as the direct route (200).
- Orchestrator confirmation: `npm run test`, `npm run lint`, `npm run build` passed; Cypress 9/9 against the packaged stack; `/discovery/` is the SPA and `/discovery/api/config` returns 401 JSON.
