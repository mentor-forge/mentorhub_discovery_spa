import type { CardType } from '@/api/types'

export interface CardAppearance {
  icon: string
  color: string
}

const appearances: Record<CardType, CardAppearance> = {
  Customer: { icon: 'mdi-domain', color: 'blue-darken-2' },
  Coordinator: { icon: 'mdi-account-tie', color: 'brown' },
  Member: { icon: 'mdi-account-group', color: 'teal' },
  Mentee: { icon: 'mdi-school', color: 'cyan-darken-2' },
  Products: { icon: 'mdi-package-variant', color: 'orange-darken-2' },
  Discounts: { icon: 'mdi-tag-percent', color: 'light-green-darken-3' },
  Logs: { icon: 'mdi-text-box-search', color: 'blue-grey' },
  Resource: { icon: 'mdi-book-open-page-variant', color: 'green-darken-2' },
  Path: { icon: 'mdi-map-marker-path', color: 'indigo' },
  Plan: { icon: 'mdi-clipboard-text', color: 'pink-darken-2' },
  Journey: { icon: 'mdi-routes', color: 'purple-darken-2' },
  Notification: { icon: 'mdi-bell', color: 'amber-darken-3' },
  Event: { icon: 'mdi-calendar', color: 'deep-purple' },
}

const defaultAppearance: CardAppearance = {
  icon: 'mdi-card-text-outline',
  color: 'grey-darken-1',
}

export function cardAppearance(type?: string | null): CardAppearance {
  return appearances[type as CardType] ?? defaultAppearance
}
