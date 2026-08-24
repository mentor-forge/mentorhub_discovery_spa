# F024 – Role-gated Invite and New collection buttons

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F023_search_by_name_lists`  
**Description**: Add right-aligned create/invite actions above the card grids: Home Invite Member / Invite Coordinator by role, and New Resource / Path / Plan on those list pages for mentors. Hrefs use `buildJourneyUrl` through the welcome/ALB origin.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — `data-automation-id` `{domain}-{page}-{element}`; role checks via `useRoles`
- `../mentorhub_spa_utils/README.md` — **Cross-SPA URLs** (`buildJourneyUrl`, `resolveAlbOrigin`); `useRoles` (`hasRole` is list-contains)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/DiscoveryHomePage.vue` — F023 toolbar (center search on non-home lists)
- `src/composables/useRoles.ts` — wrapper around spa_utils `useRoles`; `hasRole('coordinator' | 'customer' | 'mentor')`
- `src/utils/cardHref.ts` — existing `buildJourneyUrl` / `:8080` rewrite pattern (do not overload card click targets)
- `src/router/index.ts` — `meta.cardSource`

**Role rule:** JWT `roles` is an array. “Role contains coordinator” means `hasRole('coordinator')` (the string `coordinator` is in the list), not a substring match on a different role name. A caller may have more than one matching role; show every button whose role matches.

**Home** (`cardSource === 'home'`), right-aligned in a row above the cards (F023 toolbar right column, or a Home-only actions row if Home has no toolbar yet):

| When `roles` contains | Visible control | Label | Target |
| --- | --- | --- | --- |
| `coordinator` | button / link | Invite Member | Customer SPA new member page |
| `customer` | button / link | Invite Coordinator | Customer SPA new coordinator page |

Compose with `buildJourneyUrl` (never debug ports). Cross-SPA document URLs follow one pattern — there is no `/new` segment, and owning-SPA create routes may not exist yet:

- **Create** a domain document: `/{journey}/{domain}/` (trailing slash, no id)
- **Edit** a domain document: `/{journey}/{domain}/{id}` (card deep links already use this; these buttons are create-only)

Do not emit `/members/new`, `/resources/new`, or any other `.../new` path.

Locked create hrefs for this issue:

- Invite Member → `buildJourneyUrl('customer', 'members/')`
- Invite Coordinator → `buildJourneyUrl('customer', 'coordinators/')`

**Resources, Paths, and Plans lists only** (not members, products, notifications, or home):

| When `roles` contains | Page | Label | Target |
| --- | --- | --- | --- |
| `mentor` | `/resources` | New Resource | `buildJourneyUrl('mentor', 'resources/')` |
| `mentor` | `/paths` | New Path | `buildJourneyUrl('mentor', 'paths/')` |
| `mentor` | `/plans` | New Plan | `buildJourneyUrl('mentor', 'plans/')` |

Do not confuse Discovery **list** URLs (`/discovery/resources`, `/discovery/members/`) with owning-SPA **create** URLs (`/mentor/resources/`, `/customer/members/`).

Keep Search by Name centered on those three pages. Put the New button in the toolbar **right** column so it is right-aligned in the same row as the centered search.

These controls **leave Discovery**. Use an `href` (`v-btn` or anchor), not a Vue Router `to`. From Vite/debug port `8398`, hrefs must include `:8080` and `/customer/` or `/mentor/` — same origin rules as F020.

**External prerequisite:** Owning SPAs may not yet implement `/{domain}/` create routes. Discovery still composes those hrefs using the create/edit pattern above. Do not read other SPA repositories. Do not navigate to those pages in unit tests.

**Out of scope**: Search behavior (F023). Cypress and packaging (F025). Do not add New buttons on members, products, notifications, or admin. Do not add these controls as hidden/disabled stubs when the role is absent — omit them.

## Goals

- Home shows Invite Member iff roles contain `coordinator`, and Invite Coordinator iff roles contain `customer`. Both may appear together. Neither appears for mentor-only / mentee-only / admin-only / empty roles.
- Resources / Paths / Plans show the matching “New {Collection}” button iff roles contain `mentor`. Other typed lists and Home do not show those three buttons.
- Buttons are right-aligned above the card grid. On searchable lists they share the F023 toolbar (search stays centered).
- Hrefs are welcome/ALB **create** URLs (`/{journey}/{domain}/`). Unit tests with `window.location` at `http://127.0.0.1:8398/...` expect:
  - Invite Member → `http://127.0.0.1:8080/customer/members/`
  - Invite Coordinator → `http://127.0.0.1:8080/customer/coordinators/`
  - New Resource / Path / Plan → `http://127.0.0.1:8080/mentor/resources/`, `/mentor/paths/`, `/mentor/plans/`
  - Trailing slash on the domain segment; no `/new`; no `:8398`, `:8388`, `:8392`, or `:8394`
- Stable automation ids:
  - `discovery-home-invite-member-button`
  - `discovery-home-invite-coordinator-button`
  - `discovery-resources-new-button`
  - `discovery-paths-new-button`
  - `discovery-plans-new-button`
- Prefer a small local href helper (for example `src/utils/createActionHref.ts`) so the page stays thin and harvestable later. Do not publish spa_utils from this repo.
- Extracting a tiny actions-row child component is allowed if it keeps `DiscoveryHomePage.vue` readable; unit-test the helper (and the child if created). Pages remain E2E-covered in F025.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — href helper coverage from a debug-port location; role gating if a local actions component is added; F023 `useCards` tests still pass
- `npm run lint`
- `npm run build`

No Cypress or packaging in this task. Do not require other journey SPAs to be running.

## Outputs

Paths are relative to **this SPA repository root**.

**Create** (adjust filenames; record actual paths in Execution Notes):

- `src/utils/createActionHref.ts` — `buildJourneyUrl` targets listed above
- `src/utils/createActionHref.test.ts`
- Optional `src/components/DiscoveryListActions.vue` (+ `.test.ts`) if the page needs a dedicated actions row

**Update:**

- `src/pages/DiscoveryHomePage.vue` — role-gated Home invites and mentor New buttons on resources/paths/plans

Do not change PageFrame props, card click `cardHref` fallbacks, or the spa_utils pin.

## Execution Notes

- Reserved for the task execution agent.
