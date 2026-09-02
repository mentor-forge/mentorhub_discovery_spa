# F027 – Host packaged `AdminPage` at `/discovery/config`

**Status**: Shipped
**Type**: Feature
**Depends On**: `F026_pin_spa_utils_1_0_1`
**Description**: Register Vue `path: '/config'` so Settings (`hostingConfigHref()`) lands on **this** SPA at `/discovery/config`. Reuse the existing packaged `AdminPage` wrapper. Gate the route with the **admin** role; non-admins redirect away. Do not pass nav config into `PageFrame`.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame**: Settings is **admin-only** and uses `hostingConfigHref()` → `{origin}/{journeyPrefix}/config` (not `/admin/settings`, not welcome-port rewrite). **Admin config and Token claims**: Token tab ids `admin-token-profile-id-display`, `admin-token-customer-id-display`, `admin-token-mentor-id-display`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/router/index.ts` — `/admin` already loads `src/pages/AdminPage.vue` with `requiresAuth` + `requiresRole: 'admin'` and redirects missing role to Home
- `src/pages/AdminPage.vue` — already imports `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils` and feeds `GET /discovery/api/config`
- `src/App.vue` — `PageFrame` with `pageTitle` only

spa_utils 1.0.1 compiles Settings to **this** SPA’s `/discovery/config`. The hamburger must not be given local `navItems`. Do not hard-code ALB URLs or role tables on `PageFrame`.

**Out of scope**: Events list (F028). Cypress click-through, Token tab, and non-admin redirect coverage (F029). CardGrid localization (F030+).

## Goals

- Vue route `path: '/config'` (public URL **`/discovery/config`** under existing Vite `base` `/discovery/`) renders the existing packaged `AdminPage` wrapper. Import remains `{ AdminPage }` from `@mentor-forge/mentorhub_spa_utils`.
- Gate `/config` with the **admin** role using the same `requiresRole: 'admin'` pattern as `/admin`. Unauthenticated callers still hit IdP via the existing `requiresAuth` guard. Authenticated non-admins redirect away (existing Home fallback is correct).
- Keep `/admin` working so F021/F025 visits do not 404 before F029: either an **alias** of `/config` or a redirect to `{ name }` of the config route. Do not keep two different admin page implementations.
- Do **not** pass `navItems`, ALB URLs, or role tables into `PageFrame`. Settings is already in the compiled 1.0.1 catalog.
- README route list includes `/config` as the admin Settings host (Token / Config Items / Versions / Enumerators). Note that hamburger Settings stays on the hosting origin (no `:8080` rewrite).
- No new local admin chrome. Token claim labels/ids are owned by spa_utils 1.0.1 `TokenClaimsCard`.

### Craftsmanship Expectations

- Reuse the packaged `AdminPage`; do not fork Config/Token UI locally.
- Treat DRY as avoiding duplicated knowledge: the Settings href is `hostingConfigHref()`, not a Discovery-owned URL table.
- Prefer deleting a second admin page if `/admin` and `/config` would otherwise diverge.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test`
- `npm run lint`
- `npm run build`

Do not add Cypress here (F029). Router unit tests are optional; pages remain E2E-covered in F029. If a router test is added, cover: admin can resolve `/config`; non-admin `requiresRole` redirects to Home.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/router/index.ts` — `/config` (admin-gated); `/admin` alias or redirect to config
- `src/pages/AdminPage.vue` — only if the wrapper must change to stay a single host for both paths
- `README.md` — `/discovery/config` as the Settings / AdminPage host

Do not add Events. Do not pass disallowed `PageFrame` props. Do not change the spa_utils pin.

## Execution Notes

- Plan: make `/config` the canonical admin-gated route and preserve `/admin` as an alias to the same route/component; update the README route catalog and Settings-origin note; then run unit tests, lint, and build.
- Completed: registered `/config` as the canonical `AdminPage` route with `/admin` as its alias. Both paths share the same `requiresAuth` and `requiresRole: 'admin'` metadata and the existing Home fallback for authenticated non-admins.
- Documentation: updated the route catalog for the packaged Settings tabs and clarified that the Settings link remains on the hosting origin without a `:8080` rewrite.
- Verification:
  - `npm run test` — passed (11 files, 82 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed; Vite retained the existing runtime-config script and large-chunk warnings.
- Ready for orchestrator review and commit; task filename intentionally remains `PENDING.*`.
