# F019 – Adopt spa_utils `PageFrame` and remove local nav chrome

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F018_catalog_card_list_routes`  
**Description**: Replace local app-bar, hamburger, and logout with imported `PageFrame`. Keep a single host `v-app`, wrap `router-view` in `PageFrame`, and delete duplicate Discovery drawer markup that mirrors the universal catalog.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — **Universal PageFrame (1.0.0)** (allowed props, compiled hamburger, no local nav config)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/App.vue` — local `v-app-bar` / `v-navigation-drawer` / logout
- `src/App.test.ts` — stubs local Vuetify nav chrome
- `src/main.ts` / `src/initAuth.ts` — keep IdP bootstrap / `urlAuthBootstrap` as today
- `src/composables/useAppTitle.ts` — may feed `pageTitle`; do not invent a second title bar
- `src/router/index.ts` — F018 catalog routes already registered

`PageFrame` is exported from the package **root**. It already wraps `v-main`. Drawer items are **`href`** (full ALB URLs from `buildJourneyUrl`), not Vue Router `to`. Logout is built in (`nav-logout-link`: `logout()` then `redirectToIdpLogin`).

**Allowed props only:** `pageTitle` (required) and optional display-only `customerName`. Do **not** pass `navItems`, URL maps, ALB origin, role tables, extra drawer slots, or `to` links.

Keep list pages. Keep IdP hash bootstrap. Do not re-implement the hamburger catalog in this SPA.

## Goals

- `src/App.vue` (or the root layout) is:

  ```vue
  <v-app>
    <PageFrame page-title="Discovery">
      <router-view />
    </PageFrame>
  </v-app>
  ```

  `pageTitle` may stay reactive via `useAppTitle` if the bar still needs a dynamic string; still pass it as `pageTitle` only.
- Optional `customerName` only if Discovery already has a display name to show on the two customer-role labels; otherwise omit and let spa_utils read the JWT.
- Delete local hamburger items that duplicate Home / Members / Resources / Paths / Plans / Products / Notifications / Settings / Logout. Do not keep a second drawer “for Discovery-only links.”
- Do **not** register Vue `to="/"` drawer links that fight PageFrame `href`s. In-app list navigation is URL-based (user hits `/discovery/resources` via the compiled catalog or in-page links).
- `src/App.test.ts` stubs `PageFrame` (or mounts with spa_utils) instead of `VAppBar` / `VNavigationDrawer` / `VListItem`. Editor-config provide test still passes.
- README: layout chrome is `PageFrame` from spa_utils 1.0.0; do not document a local nav config API.

Card `href` composition with `buildJourneyUrl` is **F020**. Cypress id migration is **F021** (this task may update unit tests only).

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — `App.test.ts` and related unit tests pass without local-drawer assertions
- `npm run lint`
- `npm run build`

Headless Cypress against PageFrame ids is F021. Do not leave `App.test.ts` asserting `nav-discovery-link`.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/App.vue` — `PageFrame`; remove local app-bar/drawer/logout
- `src/App.test.ts` — match new layout
- `README.md` — PageFrame as the nav shell

**Delete (if they exist and are only used by local chrome):**

- Any Discovery-only nav item config module introduced in F012

Do not pass disallowed `PageFrame` props. Do not remove CardGrid list pages.

## Execution Notes

*(Reserved for the task execution agent.)*
