# F014 – Vite `base` `/discovery/` and router `BASE_URL`

**Status**: Shipped
**Type**: Feature  
**Depends On**: `F013_card_grid_e2e_and_packaging`  
**Description**: Mount the Vue app at Vite `base: '/discovery/'` with `createWebHistory(import.meta.env.BASE_URL)` so in-app URLs are `/discovery/...` (not `/discovery/discovery/...`). Keep Vue home at `/`. Do not change nginx or the API client in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `vite.config.ts` — no `base`; `injectRuntimeConfig` loads `/runtime-config.js`; `server.proxy` is `/api` only
- `src/router/index.ts` — after F012/F013, Vue routes are `/`, `/resources`, `/paths`, `/plans`, `/admin` (no Vue `/discovery` path)
- `src/App.vue` — drawer `to` values and logout `returnTo`
- `index.html` — Vite entry (asset URLs follow `base` automatically)
- `cypress.config.ts` — `baseUrl` is `http://localhost:8398`
- `cypress/e2e/navigation.cy.ts`
- `cypress/e2e/cards.cy.ts` — F013 card-grid spec (name may vary)

**External prerequisite**: Developer Edition welcome already forwards the **full** URI `http://<host>:8080/discovery/` to this container with `X-Forwarded-Prefix: /discovery`. Do not change welcome or ALB. This SPA must honor the prefix. Direct port **8398** stays published.

**Do not** turn this SPA into an edge reverse proxy or micro-frontend shell. F-DS01 (card landing) is the product UI, not the router in front of other SPAs.

**Avoid `/discovery/discovery`:** Vite `base` is `/discovery/`. Vue home must stay `/` (F012 already removed the `/` → `/discovery` redirect). Do **not** re-introduce a Vue route named `/discovery`.

This task does not edit `nginx.conf.template`, the Dockerfile, or `src/api/client.ts` (`API_BASE` stays `/api` until F016).

## Goals

- `vite.config.ts` sets `base: '/discovery/'`. There is only this one base — do not add a second root-only Vite build.
- `src/router/index.ts` uses `createWebHistory(import.meta.env.BASE_URL)`. Vue paths remain `/`, `/resources`, `/paths`, `/plans`, `/admin`.
- Runtime-config script injection uses the Vite base (or `import.meta.env.BASE_URL`), not a hardcoded `/runtime-config.js`. Example URL: `/discovery/runtime-config.js`.
- `server.proxy` also proxies `/discovery/api` to `http://localhost:8397` (path rewritten so the API still sees `/api/...`) so `npm run dev` works under the base. Keep the existing `/api` proxy for now.
- Drawer `router-link` `to` values stay Vue paths (`/`, `/resources`, …), not `/discovery/...` duplicates. Logout return URL uses the Vite base (origin + `/discovery/`), not origin + `/` only.
- Cypress `baseUrl` remains `http://localhost:8398`. Visits that used `/` or `/discovery` as a **Vue** path become `/discovery/` (home), `/discovery/resources`, `/discovery/paths`, `/discovery/plans`, `/discovery/admin`. Do not visit `/discovery` (no trailing slash) as if it were a second Vue segment. Intercepts may stay `/api/...` until F016.
- `IDP_LOGIN_URI` / `VITE_IDP_LOGIN_URI` remain `http://<HOST_NAME>:8080/login.html` (no change to IdP host or path).
- `README.md` notes that `npm run dev` serves the app at `http://localhost:8398/discovery/`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build` — built `index.html` asset and runtime-config URLs start with `/discovery/` (not `/assets/` at site root). Confirm there is no `/discovery/discovery` in generated HTML.
- Cypress visit paths updated in this task so later nginx work is not blocked by stale `/` visits. Full container Cypress is F015/F016.

Do not require `npm run container` here (nginx still serves only `/`).

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `vite.config.ts` — `base`, runtime-config inject URL, `/discovery/api` proxy
- `src/router/index.ts` — `createWebHistory(import.meta.env.BASE_URL)`
- `src/App.vue` — logout return URL uses the base; no Vue `/discovery` link
- `README.md` — dev URL `/discovery/`
- `cypress/e2e/navigation.cy.ts` — visits under `/discovery/`
- `cypress/e2e/cards.cy.ts` (or F013 spec name) — same visit prefix

Do not change `nginx.conf.template`, `Dockerfile`, or `src/api/client.ts` in this task.

## Execution Notes

- Plan: configure Vite and Vue Router around the single `/discovery/` base, make runtime-config and logout URLs base-aware, and add a rewritten development proxy for `/discovery/api`.
- Plan: update documented development and Cypress browser paths while leaving Vue route definitions and API intercept paths unchanged.
- Plan: run unit tests, lint, and build, then inspect generated `index.html` for `/discovery/` URLs and any duplicated `/discovery/discovery`.
- Implemented: set the Vite base, derived runtime-config and favicon URLs from the resolved base, added the rewritten `/discovery/api` development proxy, and initialized router history with `import.meta.env.BASE_URL`.
- Implemented: made logout return to the base-aware app home, documented the prefixed dev URL, and moved Cypress visits/path assertions under `/discovery/` without changing API intercepts or Vue route paths.
- Verification: `npm run test` passed (9 files, 48 tests); `npm run lint` passed; `npm run build` passed. Vite reported only its existing non-module runtime-config and large-chunk warnings.
- Orchestrator confirmation: `npm run test`, `npm run lint`, and `npm run build` passed; built `index.html` uses `/discovery/` asset and runtime-config URLs with no `/discovery/discovery`.
