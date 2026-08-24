# F015 – SPA nginx prefix `/discovery/` and runtime-config

**Status**: Shipped
**Type**: Feature  
**Depends On**: `F014_vite_base_and_router_prefix`  
**Description**: Teach container nginx to serve the Vite `base` `/discovery/` prefix (assets, SPA fallback, prefixed API proxy, prefixed `runtime-config.js`) while keeping direct-port `/api/` and `/runtime-config.js` for debugging.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `nginx.conf.template` — today: `location /api/`, `location = /runtime-config.js`, `location /` → `try_files` to `/index.html`
- `Dockerfile` — copies dist to `/usr/share/nginx/html`; `envsubst` writes `/usr/share/nginx/html/runtime-config.js`; default `API_PORT=8397`; `IDP_LOGIN_URI=http://127.0.0.1:8080/login.html`
- `vite.config.ts` — F014 `base: '/discovery/'` (asset URLs are prefixed; **output folder is still dist root**)
- `public/runtime-config.js.template`
- `package.json` — `open` currently opens `http://localhost:8398`

**External prerequisite**: Welcome already proxies `:8080/discovery/*` to this container **without stripping the prefix**. This nginx must accept `/discovery/...` on port 80. Do not edit welcome or CloudFormation.

Vite `base` does **not** move files under `dist/discovery/`. Nginx must map `/discovery/` onto `/usr/share/nginx/html/` (internal `rewrite` is OK).

Keep a **single** image/build. Do not add a root-only nginx profile.

`IDP_LOGIN_URI` stays `http://<HOST_NAME>:8080/login.html`.

API client still uses `/api` until F016; prefixed `/discovery/api/` must still be correct so F016 can switch the client.

## Goals

- `nginx.conf.template`:
  - `location /discovery/api/` proxies to `http://${API_HOST}:${API_PORT}/api/` (Discovery API **8397**), with the same proxy headers as the existing `/api/` block.
  - `location /discovery/` maps the prefix onto the dist root and falls back to `index.html` for Vue history mode. Welcome already forwarded the full URI.
  - Keep `location /api/` for **direct-port** debugging.
  - `location = /` redirects to `/discovery/` so `http://<host>:8398/` still reaches the app.
  - Prefixed `runtime-config.js` (e.g. `location = /discovery/runtime-config.js`) **and** keep `location = /runtime-config.js`. Both must `no-store` (not the immutable static-asset cache).
  - Keep `/health` (container health).
- Dockerfile / start command: still generate `runtime-config.js` from the template via `envsubst` of `IDP_LOGIN_URI`. Both nginx locations must serve that generated file (duplicate `envsubst`, alias, or `try_files` — pick one; do not leave the prefixed URL 404).
- `package.json` `open` (and README) use `http://localhost:8398/discovery/`.
- README documents: welcome origin `:8080/discovery/`; direct debug `:8398/discovery/`; API via SPA nginx; this SPA is not an edge router for other journeys.
- Do not proxy other journey SPAs or `/api` of other domains.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run container`
- `npm run service` — then:
  - `http://localhost:8398/` redirects to `/discovery/`
  - `http://localhost:8398/discovery/` returns this SPA (`index.html` / app shell), not a 404
  - `http://localhost:8398/discovery/runtime-config.js` is `200` and contains `IDP_LOGIN_URI`
  - `http://localhost:8398/api/` still proxies (debug)
  - `http://localhost:8398/discovery/api/` also proxies to the Discovery API (e.g. a 401 without a token is acceptable; HTML from a missing location is not)
- If Developer Edition welcome is already up on `:8080`, optionally confirm `http://localhost:8080/discovery/` is this SPA, not welcome `index.html`. If welcome is not in this `mh up discovery` stack, record that as an external check — do not change other repos.

Headless Cypress against the prefixed container is required in F016 (API client + intercepts). This task may run `npm run cypress:run` if F014 visit paths already match and `/api` intercepts still hit `location /api/`; if Cypress fails only because of API prefix, leave the fix to F016.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `nginx.conf.template` — `/discovery/`, `/discovery/api/`, `/` redirect, dual `runtime-config.js`
- `Dockerfile` — only if start/`envsubst` must emit or alias the prefixed runtime-config
- `README.md` — prefixed URLs and direct-port debug
- `package.json` — `open` URL `/discovery/`

Do not change `src/api/client.ts` in this task.

## Execution Notes

- Plan:
  - Add exact root redirect, prefixed API/runtime-config handling, and a `/discovery/` SPA fallback that maps to the existing dist root while preserving direct debug and health locations.
  - Update the documented/opened container URLs to `/discovery/`; keep the single image and existing runtime-config generation.
  - Run lint, unit tests, build, container build, service startup, and the required direct-port HTTP spot-checks; record results below.
- Implementation:
  - Added `/discovery/api/` with the same proxy target and headers as direct-debug `/api/`.
  - Added `/discovery/` dist-root mapping/history fallback, exact `/` redirect, and exact prefixed runtime-config handling. Kept `/health`, `/api/`, `/runtime-config.js`, and the single generated runtime-config file/image.
  - Preserved immutable caching for prefixed static assets while both exact runtime-config URLs remain `no-store`.
  - Updated the README access/proxy boundaries and the `npm run open` URL. No Dockerfile change was needed.
- Verification (2026-08-23):
  - `npm run lint`: passed.
  - `npm run test`: passed, 9 files / 48 tests.
  - `npm run build`: passed. Vite retained its existing non-module runtime-config and large-chunk warnings.
  - `npm run container`: passed against the final nginx configuration. Docker reported its existing JSON-form `CMD` recommendation; dependency install reported one high-severity audit finding.
  - `npm run service`: passed; Discovery stack restarted and opened `http://localhost:8398/discovery/`.
  - `GET http://localhost:8398/`: `302`, relative `Location: /discovery/`.
  - `GET http://localhost:8398/discovery/`: `200 text/html`, Discovery app shell with `/discovery/` runtime-config/assets.
  - `GET http://localhost:8398/discovery/runtime-config.js`: `200 application/javascript`, `Cache-Control: no-store`, contains `IDP_LOGIN_URI: 'http://m5max.tailb0d293.ts.net:8080/login.html'`.
  - `GET http://localhost:8398/api/` and `/discovery/api/`: both reached Discovery API and returned its identical `404` 207-byte response for the undefined API root (confirmed against direct `http://localhost:8397/api/`); neither returned the SPA shell.
  - `GET http://localhost:8398/discovery/resources`: `200 text/html` via Vue history fallback; `/health` returned `healthy`.
  - Prefixed JS asset returned `200` with `Cache-Control: public, immutable`.
  - Optional welcome check `GET http://localhost:8080/discovery/`: `200 text/html`; body checksum matched the direct Discovery app shell.
- Orchestrator confirmation: curl spot-checks passed against the running packaged stack — `/` 302 to `/discovery/`, `/discovery/` 200 SPA, prefixed runtime-config 200 `no-store` with `IDP_LOGIN_URI`, `/api/config` and `/discovery/api/config` both 401 JSON from the API, welcome `:8080/discovery/` 200 matching the SPA shell.
