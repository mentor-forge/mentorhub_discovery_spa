# Discovery SPA AWS exit audit

The current branch pins SPA Utils 1.0.6 in `package.json` and
`package-lock.json`. The lock has 416 CodeArtifact tarball URLs, including the
shared package and third-party packages. The tracked root `.npmrc` routes the
Mentor Forge scope to CodeArtifact. Git ignores local config such as
`scripts/.npmrc` and `.env.local`. The README and task planning guide still
reference CodeArtifact authentication for dependency setup.

| Path | Current dependency | Cutover |
| --- | --- | --- |
| `package.json`, `package-lock.json`, `.npmrc` | CodeArtifact pin, resolved tarballs, and scoped registry | Pin the published SPA Utils 1.0.7 release exactly from GitHub Packages. Resolve third-party packages from public npm and keep the regenerated lockfile. |
| `Dockerfile`, `scripts/docker-build.sh` | The wrapper uses the AWS CLI to obtain a CodeArtifact token and the Dockerfile consumes it through the `codeartifact_token` BuildKit mount | Use a GitHub Packages read token through a scoped BuildKit secret and install from the committed lock. |
| `.github/workflows/docker-push.yml` | AWS OIDC credentials and a CodeArtifact token for the image build | Validate pull requests separately and keep GHCR publishing on main. Give the workflow only the package access it needs. |
| `README.md`, `tasks/_PLANNING.md` | Developer instructions assume CodeArtifact credentials | Document the GitHub Packages token and locked setup. |

## Shared package prerequisite and rollback

[I-US01](https://github.com/mentor-forge/mentorhub_spa_utils/issues/43) specifies
public visibility for SPA Utils on GitHub Packages. Installation still
requires authentication. The Customer SPA lock and clean-install record
verify the published 1.0.7 tarball and SHA-512 integrity in another consumer.
Verify a clean Discovery SPA install with a GitHub token that has
`read:packages`, and grant this repository read access under the shared
package's **Manage Actions access** settings. Confirm the workflow token can
install the package in hosted CI. Keep GitHub auth scoped to the package
registry and keep all third-party packages on public npm.

For later rollbacks, restore the last verified exact GitHub Packages
version and matching lockfile together. Verify the restored install and rebuild
the image before redeployment. The pre-migration 1.0.6 lock requires legacy
CodeArtifact access and cannot serve as an AWS-free rollback.

## Runtime boundary

`src/initAuth.ts` calls shared `bootstrapAuthFromUrl` and
`syncAuthFromStorage`. `src/composables/useAuth.ts` re-exports the shared
authentication and role helpers. The SPA consumes the package root and its
Cypress auth helpers. Preserve the shared JavaScript, types, styles, and
Cypress exports during cutover. Tracked application sources contain no direct
Cognito, AWS SDK, or AWS endpoint references.

Vite uses `VITE_IDP_LOGIN_URI` and proxies the Discovery API for local
development. The packaged app loads `runtime-config.js` before bootstrapping
and reads its `IDP_LOGIN_URI`. Nginx proxies API requests through
`API_HOST` and `API_PORT`. Preserve the Discovery route prefix, the
shared-origin links, and the existing JWT and role behavior. The migration
requires no Discovery-specific auth adapter, OpenAPI change, or data schema
change. [Mentor Hub coordination](https://github.com/mentor-forge/mentorhub/issues/80)
defers production identity and hosting selection. Local acceptance uses the
existing Developer Edition services.

The runtime image currently uses the floating `nginx:stable-alpine` tag.
The separate Nginx task owns the version pin and dual-architecture validation.
Retain the packaged Cypress deployment checks and assess Vite coverage
separately during acceptance.

### Locked dependency cutover

The committed npm configuration routes only the Mentor Forge scope to GitHub
Packages and reads authentication from `GITHUB_TOKEN`. The package manifest
pins SPA Utils 1.0.7 exactly. The lockfile retains the published GitHub tarball
and SHA-512 integrity. Its 415 third-party packages use public npm with their
existing versions and integrity values.

An authenticated install and a fresh-cache `npm ci` passed without AWS
credentials. All 125 unit tests and the production build passed. The pinned
GitHub tarball returned HTTP 401 without a token. Hosted workflow package
access is verified separately.

## Container build

Run `npm run container` with a `GITHUB_TOKEN` that can read GitHub Packages.
The Dockerfile installs from the committed lock using registry-scoped auth in
a BuildKit secret and temporary npm configuration. The build context excludes
npm configuration files. The wrapper preserves the default GHCR image tag
and accepts `DISCOVERY_SPA_IMAGE` for isolated testing.

An AWS-free ARM64 build passed. Final image history and filesystem checks found
no npm auth configuration. All 35 packaged Cypress cases passed with isolated
Discovery API and seeded MongoDB, including runtime configuration, redirects,
the Discovery base path, and authenticated and unauthenticated API proxying.

## GitHub Actions

Pull requests into main first verify that the lock agrees with the manifest
and that tarballs resolve from the expected registries. Fork and Dependabot pull
requests run only this credential-free check. Same-repository pull requests
also use the built-in workflow token with package read access for a locked
install, unit tests, type checking, production build, and an unpublished
container build. In the SPA Utils package settings, grant this repository
Actions read access if the workflow token cannot download the package.

Pushes to main publish the AMD64 and ARM64 image under the existing GHCR tag.
The publishing job reads repository contents and has package write access.
Both container workflows pass package authentication through the BuildKit
secret named `github_npm_token`. Hosted package access is verified on the PR
after the branch is pushed.
