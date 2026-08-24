import type { CardType } from '@/api/types'

export interface CardAppearance {
  icon: string
  color: string
}

const appearances: Record<CardType, CardAppearance> = {
  Event: { icon: 'mdi-calendar', color: 'deep-purple' },
  Member: { icon: 'mdi-account-group', color: 'teal' },
  Mentee: { icon: 'mdi-school', color: 'cyan-darken-2' },
  Notification: { icon: 'mdi-bell', color: 'amber-darken-3' },
  Path: { icon: 'mdi-map-marker-path', color: 'indigo' },
  Plan: { icon: 'mdi-clipboard-text', color: 'pink-darken-2' },
  Resource: { icon: 'mdi-book-open-page-variant', color: 'green-darken-2' },
}

const defaultAppearance: CardAppearance = {
  icon: 'mdi-card-text-outline',
  color: 'grey-darken-1',
}

export function cardAppearance(type?: string | null): CardAppearance {
  return appearances[type as CardType] ?? defaultAppearance
}
