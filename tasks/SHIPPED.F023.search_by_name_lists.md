# F023 – Search by Name on non-home CardGrid lists

**Status**: Shipped  
**Type**: Feature  
**Depends On**: `F022_typed_list_name_query`  
**Description**: Add a centered Search by Name input above the card grid on every CardGrid list except the default Home dashboard. Wire the debounced value through `useCards` to the F022 `name` query. Do not add Invite/New buttons in this task.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md` — TanStack Query keys include filters; `data-automation-id` `{domain}-{page}-{element}`; pages covered by E2E
- `../mentorhub_spa_utils/README.md` — **`ListPageSearch`** (default label already “Search by name”, 300ms debounce pattern in `useResourceList`); CardGrid dashboards should **not** switch to `useResourceList`
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/DiscoveryHomePage.vue` — shared CardGrid page for all seven list routes
- `src/composables/useCards.ts` / `src/composables/useCards.test.ts`
- `src/router/index.ts` — `meta.cardSource` (`home` vs typed lists)
- `src/api/client.ts` — F022 optional `name` on typed lists

Search belongs on **all CardGrid lists other than the default dashboard**:

| `cardSource` | Search by Name |
| --- | --- |
| `home` (`/`) | **No** — do not render the input; do not send `name` |
| `members`, `resources`, `paths`, `plans`, `products`, `notifications` | **Yes** — centered above the grid |

Admin (`/admin`) is not a card list; leave it unchanged.

Prefer spa_utils `ListPageSearch` from the package root. Keep debounce at **300ms** (same as `useResourceList`). Do **not** adopt `useResourceList` for these offset/size card dashboards — extend `useCards` instead.

Layout: a toolbar row above loading/empty/error/grid so F024 can add right-aligned actions without moving the search. Use a three-column row (flexible left, constrained center, flexible right). Center the search field in the middle column (`mx-auto`, modest max-width). Leave the right column empty in this task. Home may omit the toolbar entirely until F024, or render the same row with no center search — either is fine as long as Home has no Search by Name control.

If F022 recorded that a typed source (likely `notifications`) does not document `name` on the live spec, still show Search by Name and filter that source’s loaded cards with a case-insensitive `card.name` contains match. Do not invent extra API filters.

**Out of scope**: Invite Member / Invite Coordinator / New Resource / New Path / New Plan buttons (F024). Cypress and packaging (F025). Do not search the home composite client-side as a substitute.

## Goals

- Non-home CardGrid pages show a Search by Name input centered above the card grid. Label is “Search by Name” (or spa_utils default “Search by name”). The control is clearable.
- Stable automation ids: `discovery-{source}-search` (for example `discovery-resources-search`). Optional toolbar id `discovery-{source}-toolbar`.
- `useCards` includes the debounced search string in the TanStack query key (for example `['cards', source, name]`). Empty search keeps the unfiltered first page (`offset=0`, `size=20`) with no `name` query.
- After debounce, typed sources that support `name` call the F022 client with that value. Home queries never receive a name argument.
- Clearing the input restores the unfiltered list. Loading / empty / error states still apply to the filtered result (empty search-miss is the existing empty automation id).
- Unit tests for `useCards`: home does not pass `name`; a typed source passes debounced `name` and updates the query key; blank search omits `name`.
- Home (`/`) has no search input.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — `useCards` search/debounce/query-key coverage; existing dismiss and unfiltered list tests still pass
- `npm run lint`
- `npm run build`

Pages are verified by E2E in F025, not by page-level Vitest. Do not add Cypress in this task.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/composables/useCards.ts` — debounced name, query key, typed-list client call
- `src/composables/useCards.test.ts`
- `src/pages/DiscoveryHomePage.vue` — centered `ListPageSearch` for non-home sources; toolbar row for later actions

Do not add create/invite buttons. Do not change PageFrame props or the spa_utils pin.

## Execution Notes

- Extended `useCards` composable (`src/composables/useCards.ts`):
  - Added 300ms debounce handling via `debouncedSearch` and `searchQuery`.
  - Added reactive `queryKey` reflecting debounced search string (`['cards', source, name]` vs `['cards', source]`).
  - Added client-side contains filter on `card.name` for notifications.
  - Reset search state on route/source changes.
- Updated `DiscoveryHomePage.vue` (`src/pages/DiscoveryHomePage.vue`):
  - Rendered 3-column toolbar row (`data-automation-id="discovery-${source}-toolbar"`) above the grid on all non-home card list pages.
  - Centered `ListPageSearch` with `data-automation-id="discovery-${source}-search"`.
  - Preserved Home (`/`) without search input.
- Added comprehensive unit tests in `src/composables/useCards.test.ts` covering:
  - 300ms debounce delay and API parameter passing
  - Blank/whitespace search omission
  - Home query ignoring search and never sending name parameter
  - Notifications client-side name contains filter
- Verification results:
  - `npm run test`: 10 test files passed (74 tests total)
  - `npm run lint`: passed cleanly
  - `npm run build`: built production bundle successfully
