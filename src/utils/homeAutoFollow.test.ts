import { describe, expect, it } from 'vitest'
import type { Card } from '@/api/types'
import type { CardListSource } from '@/composables/useCards'
import { shouldAutoFollowHomeCards } from './homeAutoFollow'

const linkedCard: Card = { _id: 'mentee-1', type: 'Mentee' }
const linkedHref = 'http://127.0.0.1:8080/mentor/mentees/mentee-1'

describe('shouldAutoFollowHomeCards', () => {
  it.each([
    [[], false],
    [[linkedCard], true],
    [[linkedCard, { _id: 'mentee-2', type: 'Mentee' }], false],
  ])('handles a Home result containing %i cards', (cards, expected) => {
    expect(shouldAutoFollowHomeCards('home', cards, linkedHref)).toBe(expected)
  })

  it.each([undefined, '', '   '])('rejects a missing or empty href', (href) => {
    expect(shouldAutoFollowHomeCards('home', [linkedCard], href)).toBe(false)
  })

  it.each<CardListSource>([
    'events',
    'members',
    'resources',
    'paths',
    'plans',
    'products',
    'notifications',
  ])('rejects the non-Home %s source', (source) => {
    expect(shouldAutoFollowHomeCards(source, [linkedCard], linkedHref)).toBe(false)
  })

  it.each([
    '/discovery',
    '/discovery/',
    'http://127.0.0.1:8080/discovery/',
    'http://example.test/discovery/?from=card#home',
  ])('rejects the Home document href %s', (href) => {
    expect(shouldAutoFollowHomeCards('home', [linkedCard], href)).toBe(false)
  })
})
