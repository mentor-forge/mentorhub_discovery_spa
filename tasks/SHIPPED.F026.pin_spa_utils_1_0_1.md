# F026 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.1`

**Status**: Shipped
**Type**: Feature
**Depends On**: `F025_search_and_actions_e2e`
**Description**: This repo owns the Discovery SPA **1.0.1 pin**. Bump `@mentor-forge/mentorhub_spa_utils` from `1.0.0` to **`1.0.1`**, refresh the lockfile from CodeArtifact, and fix any compile/unit-test breakage from the 1.0.1 catalog, logout `return_to`, Settings `hostingConfigHref`, and Token claims. Do not add `/config` or `/events` in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — install pin **1.0.1**; **Universal PageFrame** (1.0.1 catalog: Home, Events, Resources, Paths, Plans; Notifications + Settings **admin-only**; Settings = `hostingConfigHref()` → `{origin}/{prefix}/config`); logout `logout()` then `redirectToIdpLogin(buildJourneyUrl('discovery'))`; **Admin config and Token claims**
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `1.0.0`
- `src/App.vue` — `PageFrame page-title="Discovery"` only (keep)
- `src/initAuth.ts` — keep IdP bootstrap / `urlAuthBootstrap` as today

**External prerequisite**: `mentorhub_spa_utils` F041–F046 shipped and **`@mentor-forge/mentorhub_spa_utils@1.0.1` is published to CodeArtifact**. Vue `base` + SPA nginx prefix `/discovery/` are already shipped (F014–F016 / mentorhub L022). Run `mh` then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.1** is not available, set this task **Status** to `Blocked` and stop — do not stay on `1.0.0` and do not point `package.json` at a git URL.

This SPA is the **first** journey SPA in the 1.0.1 wave and **owns the pin**. Sibling SPAs pin independently; do not change other repos.

**Out of scope**: Vue `/config` (F027), Events list (F028), Cypress catalog/settings/events assertions (F029). Do not pass `navItems`, ALB origins, or role tables into `PageFrame`. Do not override logout locally.

## Goals

- `package.json` and `package-lock.json` pin `@mentor-forge/mentorhub_spa_utils` to exact **`1.0.1`**.
- After `mh`, run `npm install --include=dev` so the lockfile resolves from CodeArtifact.
- The app still builds and unit-tests: `PageFrame` still receives only `pageTitle` (and optional unused `customerName` if already present). IdP bootstrap / `redirectToIdpLogin` stay as today. Logout `return_to` remains owned by spa_utils — do not add a local logout handler.
- README dependency / architecture notes say spa_utils **1.0.1** (not 1.0.0). Document the 1.0.1 hamburger catalog in prose (Home, Events, Resources, Paths, Plans; Notifications and Settings admin-only; Settings lands on this SPA’s `/config` once F027 ships). Do not invent a local nav config API.
- Fix any `src/**` import or type breakage from 1.0.1. Do not add routes in this task.

### Craftsmanship Expectations

- Reuse `mentorhub_spa_utils` for shared SPA behavior rather than creating local equivalents.
- Do not introduce local workarounds for catalog, logout `return_to`, or Settings href — those are owned by 1.0.1 `PageFrame` / `hostingConfigHref` / `buildJourneyUrl`.
- Prefer deleting obsolete local behavior when responsibility has moved to spa_utils. Do not grow a parallel hamburger.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` then `npm install --include=dev`
- Confirm `npm ls @mentor-forge/mentorhub_spa_utils` reports **1.0.1**
- `npm run test`
- `npm run lint`
- `npm run build`

Cypress/packaging are **F029**. Existing Cypress still encodes the 1.0.0 catalog (`nav-products-link`, Settings → `/admin/settings`, mentee Notifications). Do not “fix” those specs here unless a unit test fails; leave E2E updates to F029.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.1"`
- `package-lock.json` — resolved 1.0.1 from CodeArtifact
- `README.md` — spa_utils version note and 1.0.1 catalog ownership
- Any `src/**` import or type that fails to compile against 1.0.1

Do not add `/config` or `/events` routes. Do not pass disallowed `PageFrame` props. Do not change Cypress in this task unless a compile of test helpers breaks.

## Execution Notes

- Planned approach: review the required architecture and SPA guidance, pin and install `@mentor-forge/mentorhub_spa_utils@1.0.1` from CodeArtifact, update the README catalog/version notes, resolve only any resulting `src/**` compatibility issues, and run the required verification suite.
- Files changed:
  - `package.json` — pinned `@mentor-forge/mentorhub_spa_utils` to exact version `1.0.1`.
  - `package-lock.json` — refreshed the package entry to the CodeArtifact-hosted 1.0.1 tarball and integrity.
  - `README.md` — updated dependency ownership to 1.0.1 and documented the Home, Events, Resources, Paths, Plans, admin-only Notifications, and admin-only hosting-SPA Settings catalog.
  - `tasks/PENDING.F026.pin_spa_utils_1_0_1.md` — recorded status and execution details.
- Commands run from the SPA root:
  - `mh && npm install --include=dev` — passed; CodeArtifact auth refreshed and one package changed.
  - `npm ls @mentor-forge/mentorhub_spa_utils` — passed; reports `@mentor-forge/mentorhub_spa_utils@1.0.1`.
  - `npm run test` — passed; 11 test files and 82 tests passed.
  - `npm run lint` — passed with no type errors.
  - `npm run build` — passed; Vite built 648 modules. Existing informational warnings remained for the non-module runtime-config script and chunks over 500 kB.
- Compatibility result: no `src/**` import or type changes were needed. `App.vue` continues to pass only `page-title="Discovery"` to `PageFrame`, and `initAuth.ts` remains unchanged.
- Follow-ups: F027 must add the `/config` route before the 1.0.1 Settings link has a local destination. Catalog/settings/events Cypress updates remain deferred to F029 as required.
