import { describe, expect, it } from 'vitest'
import type { CardType } from '@/api/types'
import { cardAppearance } from './cardAppearance'

describe('cardAppearance', () => {
  it.each<CardType>([
    'Event',
    'Member',
    'Mentee',
    'Notification',
    'Path',
    'Plan',
    'Resource',
  ])('maps %s to an icon and color', (type) => {
    const appearance = cardAppearance(type)

    expect(appearance.icon).toMatch(/^mdi-/)
    expect(appearance.color).toBeTruthy()
  })

  it('uses distinct appearances for every known card type', () => {
    const types: CardType[] = [
      'Event',
      'Member',
      'Mentee',
      'Notification',
      'Path',
      'Plan',
      'Resource',
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
