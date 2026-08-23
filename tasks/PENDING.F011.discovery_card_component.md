# F011 – Discovery card chrome, type variation, and markdown body

**Status**: Pending  
**Type**: Feature  
**Depends On**: `F010_card_api_client`  
**Description**: Add a reusable Discovery card that shows `name` as the title, renders `description` as markdown (not raw source), varies icon and color by `Card.type`, opens `link` on click, and exposes a dismiss action for Notification cards.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `CardGrid` / `MhCard` (title + optional `name`, `color`, `#actions` slot). `MarkdownEditor` is an **edit** textarea; do not use it as the card body renderer.
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/api/types.ts` — `Card` from F010
- `src/pages/DiscoveryHomePage.vue` — current `CardGrid` + `MhCard` stub
- `src/plugins/vuetify.ts` — MDI icon set is already configured
- `vitest.config.ts` — coverage excludes pages; add component thresholds when components land

**External prerequisite**: `Card.type` wire values include `Event`, `Member`, `Mentee`, `Notification`, `Path`, `Plan`, and `Resource`. Icon and color are a **local** UI table keyed by those values. Runtime `GET /api/config` enumerators remain the source for enumerator **labels** if a type label is shown. Do not copy enumerator files from another repository.

This task does not register routes or call the API. F012 will place this component inside `CardGrid` on list pages.

## Goals

- A local markdown **display** component renders `description` to sanitized HTML (headings, emphasis, lists, links). The visible body is rendered HTML, not raw markdown source. Sanitize before any `v-html` (XSS). Add a small renderer/sanitizer dependency if needed; pin exact semver and run `mh` before `npm install`.
- A local appearance helper maps every `Card.type` value listed above to a distinct MDI icon and Vuetify `color`. Unknown or missing `type` uses one default appearance and still renders the card.
- `DiscoveryCard` composes spa_utils `MhCard`:
  - Title is `card.name`.
  - `color` and a visible type icon come from the appearance helper.
  - Body is the rendered markdown `description` (missing description → empty body, not the literal `undefined`).
  - When `card.link` is present, clicking the card (title or body) opens that URI. When `link` is absent, the card is not a navigation target.
  - When `card.type` is `Notification`, `#actions` includes a dismiss control that **emits** dismiss (no API call here) and **does not** follow `link` (`click` stopped).
  - Stable `data-automation-id` values, for example `discovery-card-{id}`, `discovery-card-{id}-title-display`, `discovery-card-{id}-body-display`, `discovery-card-{id}-dismiss-button`.
- Keep the markdown display and appearance helper free of Discovery API client calls so they can be harvested into spa_utils later. Do not publish spa_utils from this repo.
- Unit tests: appearance mapping for all seven types plus default; markdown shows rendered text not source; a dangerous HTML snippet is sanitized; Notification dismiss emits and does not navigate; missing `link` does not navigate.
- `vitest.config.ts` coverage for `src/components/**` meets spa standards (90% lines/functions, 85% branches) or this repo’s existing component target if already declared.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm install` — required if renderer packages were added (run `mh` first).
- `npm run test` — new co-located `src/**/*.test.ts` files pass; F010 client tests still pass.
- `npm run test:coverage` — new component (and existing API/composable) thresholds hold.
- `npm run lint`
- `npm run build`

No Cypress or packaging in this task. Do not add list pages or routes.

## Outputs

Paths are relative to **this SPA repository root**.

**Create** (adjust filenames if needed; record actual paths in Execution Notes):

- `src/components/MarkdownView.vue` — sanitized markdown display
- `src/components/MarkdownView.test.ts`
- `src/components/DiscoveryCard.vue` — `MhCard` wrapper
- `src/components/DiscoveryCard.test.ts`
- `src/utils/cardAppearance.ts` — type → icon + color
- `src/utils/cardAppearance.test.ts`

**Update:**

- `package.json` / `package-lock.json` — only if a markdown/sanitizer dependency is added
- `vitest.config.ts` — `src/components/**` coverage thresholds

The agent must not update files outside this list (including `src/pages/**` and `src/router/**`).

## Execution Notes

*(Reserved for the task execution agent.)*
