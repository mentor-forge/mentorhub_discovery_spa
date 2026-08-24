# F017 – Pin `@mentor-forge/mentorhub_spa_utils@1.0.0`

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F016_prefixed_api_client_e2e_and_packaging`  
**Description**: This repo owns the Discovery SPA **1.0.0 pin**. Bump `@mentor-forge/mentorhub_spa_utils` from `0.5.x` to **`1.0.0`**, refresh the lockfile from CodeArtifact, and fix any compile/test breakage from removed infinite-scroll exports. Do not adopt `PageFrame` or add catalog routes in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — install pin **1.0.0**; **Removed in 1.0.0**: `useInfiniteScroll` / `InfiniteScroll*`; lists stay `CardGrid` + `MhCard` with offset/size headers
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `package.json` / `package-lock.json` — currently `0.5.5` (or whatever F010–F016 left)
- `src/**` — grep for `useInfiniteScroll`, `InfiniteScroll`, and any 0.5.x-only imports

**External prerequisite**: `@mentor-forge/mentorhub_spa_utils@1.0.0` is **published to CodeArtifact** (spa_utils F033–F040 / `npm run release-tag` on `main`). Run `mh` then `npm view @mentor-forge/mentorhub_spa_utils version`. If **1.0.0** is not available, set this task **Status** to `Blocked` and stop — do not stay on `0.5.x` and do not point `package.json` at a git URL.

This SPA is the **first** journey SPA in the 1.0.0 wave and **owns the pin**. Sibling SPAs pin independently; do not change other repos.

Vue `base` `/discovery/` and SPA nginx prefix are already done (F014–F016).

## Goals

- `package.json` and `package-lock.json` pin `@mentor-forge/mentorhub_spa_utils` to exact **`1.0.0`**.
- After `mh`, run `npm install --include=dev` so the lockfile resolves from CodeArtifact.
- The app still builds: no imports of `useInfiniteScroll` / `InfiniteScroll*`. List UIs remain **`CardGrid` + `MhCard`** with offset/size header pagination (already true after F012).
- README dependency note says spa_utils **1.0.0** (not 0.5.5).
- Local app-bar / drawer / logout chrome may stay until F019. Do **not** wrap `PageFrame` yet.
- Do not add Vue routes for `members/`, `products`, or `notifications` yet (F018).

## Testing Expectations

Run all commands from **this SPA repository root**.

- `mh` then `npm install --include=dev`
- Confirm `npm ls @mentor-forge/mentorhub_spa_utils` reports **1.0.0**
- `npm run test`
- `npm run lint`
- `npm run build`

Cypress/packaging are not required unless the pin breaks existing E2E. If Cypress is run, it should still pass with F016 prefixed visits and local drawer selectors.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `package.json` — `"@mentor-forge/mentorhub_spa_utils": "1.0.0"`
- `package-lock.json` — resolved 1.0.0 from CodeArtifact
- `README.md` — spa_utils version note
- Any `src/**` import that fails to compile against 1.0.0 (no infinite-scroll usage)

Do not change `src/App.vue` chrome to `PageFrame` in this task.

## Execution Notes

- Plan: authenticate to CodeArtifact with `mh` and verify that spa_utils `1.0.0` is published. If available, pin the exact dependency, refresh the lockfile with dev dependencies, update the README version note, verify no removed infinite-scroll APIs are imported, and run the required version/test/lint/build checks.
- External prerequisite verified: after `mh`, `npm view @mentor-forge/mentorhub_spa_utils version` returned `1.0.0`.
- Updated `package.json` and `package-lock.json` to exact `1.0.0`; the lockfile resolves the `1.0.0` tarball from CodeArtifact. Updated the README dependency note. No `useInfiniteScroll` or `InfiniteScroll*` imports were present, so no `src/**` changes were needed.
- Verification:
  - `npm install --include=dev` — passed.
  - `npm ls @mentor-forge/mentorhub_spa_utils` — confirmed `@mentor-forge/mentorhub_spa_utils@1.0.0`.
  - `npm run test` — passed (9 files, 48 tests).
  - `npm run lint` — passed.
- Orchestrator confirmation: `npm ls` reports `@mentor-forge/mentorhub_spa_utils@1.0.0`; `npm run test`, `npm run lint`, and `npm run build` passed.
