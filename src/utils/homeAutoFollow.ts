import type { Card } from '@/api/types'
import type { CardListSource } from '@/composables/useCards'

function isDiscoveryHomeHref(href: string): boolean {
  try {
    const pathname = new URL(href, 'http://mentorhub.local').pathname
    return pathname.replace(/\/+$/, '') === '/discovery'
  } catch {
    return false
  }
}

/** Decide whether the initial successful card result should be followed. */
export function shouldAutoFollowHomeCards(
  source: CardListSource,
  cards: readonly Card[],
  href: string | undefined,
): href is string {
  const resolvedHref = href?.trim()

  return (
    source === 'home'
    && cards.length === 1
    && resolvedHref !== undefined
    && resolvedHref !== ''
    && !isDiscoveryHomeHref(resolvedHref)
  )
}
