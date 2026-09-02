import { describe, expect, it } from 'vitest'
import type { CardType } from '@/api/types'
import { cardAppearance } from './cardAppearance'

describe('cardAppearance', () => {
  it.each<[CardType, string]>([
    ['Customer', 'mdi-domain'],
    ['Coordinator', 'mdi-account-tie'],
    ['Member', 'mdi-account-group'],
    ['Mentee', 'mdi-school'],
    ['Products', 'mdi-package-variant'],
    ['Discounts', 'mdi-tag-percent'],
    ['Logs', 'mdi-text-box-search'],
    ['Resource', 'mdi-book-open-page-variant'],
    ['Path', 'mdi-map-marker-path'],
    ['Plan', 'mdi-clipboard-text'],
    ['Journey', 'mdi-routes'],
    ['Notification', 'mdi-bell'],
    ['Event', 'mdi-calendar'],
  ])('maps %s to its locked icon', (type, icon) => {
    const appearance = cardAppearance(type)

    expect(appearance.icon).toBe(icon)
    expect(appearance.color).toBeTruthy()
  })

  it('uses distinct appearances for every known card type', () => {
    const types: CardType[] = [
      'Customer',
      'Coordinator',
      'Member',
      'Mentee',
      'Products',
      'Discounts',
      'Logs',
      'Resource',
      'Path',
      'Plan',
      'Journey',
      'Notification',
      'Event',
    ]
    const appearances = types.map((type) => cardAppearance(type))

    expect(new Set(appearances.map(({ icon }) => icon)).size).toBe(types.length)
    expect(new Set(appearances.map(({ color }) => color)).size).toBe(types.length)
  })

  it.each([undefined, null, 'Unexpected'])('uses the default appearance for %s', (type) => {
    expect(cardAppearance(type)).toEqual({
      icon: 'mdi-card-text-outline',
      color: 'grey-darken-1',
    })
  })
})
