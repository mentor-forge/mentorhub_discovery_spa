# F033 – Auto-follow the Home card when the API returns exactly one

**Status**: Shipped
**Type**: Feature
**Depends On**: `F032_notification_dismiss_and_cancel`
**Description**: On the Home cards page, if the API returns **exactly one** card, automatically follow that card’s link. This is typically a mentee with no notifications and a single mentee card. Do not auto-follow other list routes.

## Context

Always read these files before implementation:

- `../mentorhub/DeveloperEdition/standards/ArchitecturePrinciples.md`
- `../mentorhub/DeveloperEdition/standards/spa_standards.md`
- `../mentorhub_spa_utils/README.md` — `buildJourneyUrl` / card hrefs stay on welcome/ALB; do not use debug ports
- `README.md`
- `tasks/_ORCHESTRATE.md`
- `tasks/_PLANNING.md`
- `src/pages/DiscoveryHomePage.vue` — home `cardSource === 'home'` grid; cards from `useCards`
- `src/utils/cardHref.ts` — already composes the URI `DiscoveryCard` uses on click
- `src/components/DiscoveryCard.vue` — `window.open(href, '_self')` for clicks

**Rule:** After the Home query succeeds, if `cards.length === 1` and that card has a resolvable `cardHref`, navigate to it once (same mechanism as a card click: `window.open(href, '_self')` or equivalent). Typical case: mentee role, no notifications, one mentee card.

**Do not auto-follow when:**

- The source is not Home (events, members, resources, paths, plans, products, notifications, config).
- The query is still loading, errored, or returned `0` or `2+` cards.
- The single card has no link / empty `cardHref`.

Avoid a navigation loop: if the composed href would stay on this Home document (`/discovery/` with no further path), skip. Do not auto-follow as a side effect of refetch after dismiss/cancel on a remaining single card unless that still matches the product rule (exactly one card on Home) — prefer following only on the initial successful Home load for that visit so a user who dismisses down to one card is not yanked away unexpectedly. Record the chosen “once per visit / initial load” guard in **Execution Notes**.

**Out of scope**: Cypress (F034). Do not change CardGrid or icon chrome.

## Goals

- Home with exactly one linked card navigates to `cardHref` automatically after load.
- Home with zero or many cards renders the grid/empty state as today.
- Non-home lists never auto-follow, even if they return one card.
- Extract a small pure helper (e.g. `shouldAutoFollowHomeCards(source, cards)`) so the rule is unit-tested without mounting the page. The page remains E2E-covered in F034.
- README documents the mentee-oriented single-card Home redirect.

### Craftsmanship Expectations

- Reuse `cardHref`; do not invent a second deep-link composer.
- Keep the rule in Discovery (journey-specific). Do not add an auto-follow prop to spa_utils `PageFrame` or `MhCard`.

## Testing Expectations

Run all commands from **this SPA repository root**.

- `npm run test` — helper (and any composable) coverage for 0 / 1 / 2 cards, missing link, non-home source, Home self-href skip
- `npm run lint`
- `npm run build`

Cypress: intercept a one-card Home list and assert `window.open` / location; intercept two cards and assert no auto navigation — F034.

## Outputs

Paths are relative to **this SPA repository root**.

**Create** (adjust names if folded into an existing util):

- `src/utils/homeAutoFollow.ts` — or equivalent helper
- `src/utils/homeAutoFollow.test.ts`

**Update:**

- `src/pages/DiscoveryHomePage.vue` — Home-only auto-follow after successful load
- `README.md` — single-card Home behavior

Do not change notification button rules. Do not change the spa_utils pin.

## Execution Notes

- Plan: add a pure Home auto-follow decision helper that accepts the already-composed
  `cardHref`, rejects non-Home sources, non-singleton results, empty hrefs, and the
  `/discovery/` Home document; watch the Home query's first successful result and
  consume a per-component-visit guard before deciding whether to navigate.
- Guard choice: the first successful Home query result consumes the visit guard
  regardless of card count or link validity. Later refetches (including
  dismiss/cancel invalidations) cannot trigger auto-follow.
- Implemented `shouldAutoFollowHomeCards` with coverage for zero, one, and two
  cards; empty/missing hrefs; every non-Home source; and Home self-hrefs.
- `DiscoveryHomePage` waits for a successful, non-fetching Home query, composes
  the singleton destination with `cardHref`, and navigates with
  `window.open(href, '_self')` only when the helper accepts it.
- Documentation: updated `README.md` with the mentee-oriented initial Home
  single-card behavior.
- Verification (2026-09-01):
  - `npm run test` — passed (13 files, 120 tests).
  - `npm run lint` — passed.
  - `npm run build` — passed; Vite emitted the existing runtime-config script
    and large-chunk warnings.
