# F031 – Card type icons, icon padding, and hover type hint

**Status**: Shipped
**Type**: Feature
**Depends On**: `F030_localize_card_grid_layout`
**Description**: On every Discovery card, increase right padding on the type ICON and add a hover hint that displays the card type. Expand the local type → MDI icon map to the full F-DS05 set (Customer through Event).

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `MhCard` `#actions` slot (keep `MhCard` from the package)
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/components/DiscoveryCard.vue` — type `v-icon` in `#actions` with `aria-label` `{type} card`
- `src/utils/cardAppearance.ts` / `src/utils/cardAppearance.test.ts` — currently Event, Member, Mentee, Notification, Path, Plan, Resource
- `src/api/types.ts` — `CardType` union
- `src/components/DiscoveryCard.test.ts`

**Locked icon table** (wire `Card.type` → MDI):

| Type | Icon |
| --- | --- |
| Customer | `mdi-domain` |
| Coordinator | `mdi-account-tie` |
| Member | `mdi-account-group` |
| Mentee | `mdi-school` |
| Products | `mdi-package-variant` |
| Discounts | `mdi-tag-percent` |
| Logs | `mdi-text-box-search` |
| Resource | `mdi-book-open-page-variant` |
| Path | `mdi-map-marker-path` |
| Plan | `mdi-clipboard-text` |
| Journey | `mdi-routes` |
| Notification | `mdi-bell` |
| Event | `mdi-calendar` |

Confirm live `Card.type` enumerators from the running API OpenAPI (`npm run api` then `curl -X GET "http://localhost:8397/docs/openapi.yaml"`). Extend `CardType` to include every value in the table. Unknown/missing type still uses one default appearance. Keep distinct colors for types that already have them; new types need a distinct icon (colors may stay distinct where practical).

**Hover hint:** the card ICON shows the card type (the wire type string, e.g. `Resource`) on hover. Prefer Vuetify `v-tooltip` on the icon. Keep a non-hover accessible name (`aria-label` or tooltip `aria-label`). Do not put the hint on the whole card.

**Icon padding:** increase **right** padding on the type ICON on all cards (scoped CSS on the icon / actions slot). Do not restyle `MhCard` inside spa_utils.

**Out of scope**: Notification Dismiss/Cancel gating (F032) — keep today’s dismiss control unchanged. Home auto-follow (F033). Cypress (F034).

## Goals

- `cardAppearance` maps every type in the table to the locked MDI icon. Unit tests cover each mapping and the unknown-type default.
- `DiscoveryCard` type icon has increased right padding and a hover hint that displays `card.type` (empty/missing type still has a sensible default hint, not the literal `undefined`).
- Existing automation id `discovery-card-{id}-type-icon` remains on the icon (or the tooltip activator that is the icon).
- Markdown body, link click, and current Notification dismiss emit behavior are unchanged.

### Craftsmanship Expectations

- Keep the appearance table local and free of API client calls (still harvestable later). Do not copy enumerator YAML from another repository; OpenAPI from the running API is the wire-value check.
- Do not fork `MhCard` to add padding; pad the Discovery icon.

## Testing Expectations

Run all commands from **this SPA repository root**.

- Confirm OpenAPI `Card.type` / enumerator values; record them in **Execution Notes**.
- `npm run test` — appearance + DiscoveryCard icon/tooltip coverage
- `npm run lint`
- `npm run build`

Tooltip/padding visual checks in Cypress are F034.

## Outputs

Paths are relative to **this SPA repository root**.

**Update:**

- `src/api/types.ts` — `CardType` union aligned to the table / live spec
- `src/utils/cardAppearance.ts` / `src/utils/cardAppearance.test.ts`
- `src/components/DiscoveryCard.vue` / `src/components/DiscoveryCard.test.ts`
- `README.md` — only if card-type icon behavior is documented today

Do not add Cancel. Do not change CardGrid CSS except via the icon’s own padding. Do not change the spa_utils pin.

## Execution Notes

- Plan: confirm the running Discovery API `Card.type` contract; extend the local
  `CardType` and appearance table to the locked F-DS05 icon set; add an
  icon-scoped Vuetify tooltip, accessible fallback hint, and right padding; then
  cover exact icon mappings, default behavior, tooltip accessibility, and
  preserved notification behavior with unit tests.
- Live OpenAPI check (`GET http://localhost:8397/docs/openapi.yaml`) recorded
  these `Card.type` enum values: `Event`, `Member`, `Mentee`, `Notification`,
  `Path`, `Plan`, `Resource`. The locked UI table additionally requires
  `Customer`, `Coordinator`, `Products`, `Discounts`, `Logs`, and `Journey`.
- Implemented all 13 locked type-to-icon mappings while retaining the existing
  colors and assigning distinct colors to the new types. Unknown, empty, and
  missing types continue to use the single default card appearance.
- Wrapped only the type icon in a top-positioned Vuetify tooltip, preserving its
  accessible name and automation id. Added icon-scoped `8px` right padding;
  notification dismiss, card navigation, and markdown rendering are unchanged.
- Verification:
  - `npm run test` — passed (12 files, 98 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed. Vite reported the existing runtime-config script
    and large-chunk warnings; neither failed the build.
