import { describe, expect, it } from 'vitest'
import { cardHref } from './cardHref'

const debugLocation = new URL('http://127.0.0.1:8398/discovery/')

describe('cardHref', () => {
  it.each([
    [{ link: 'customer/profile/member-1', type: 'Member' as const }, '/customer/profile/member-1'],
    [{ link: 'admin/settings?tab=discounts' }, '/admin/settings?tab=discounts'],
    [{ link: 'mentor/path/path-1', type: 'Path' as const }, '/mentor/path/path-1'],
    [{ link: 'mentee/resource/resource-1', type: 'Resource' as const }, '/mentee/resource/resource-1'],
    [{ link: 'mentor/mentee/mentee-1', type: 'Mentee' as const }, '/mentor/mentee/mentee-1'],
    [{ link: 'mentee/journey' }, '/mentee/journey'],
  ])('prefixes API link %j through the welcome origin', (card, expectedPath) => {
    const href = cardHref(card, debugLocation)

    expect(href).toBe(`http://127.0.0.1:8080${expectedPath}`)
    expect(href).not.toMatch(/:(?:8398|8388|8392|8394)\b/)
  })

  it('does not invent a destination when the API omitted link', () => {
    expect(cardHref({ _id: 'member-1', type: 'Member' }, debugLocation)).toBe('')
  })

  it('does not remap a link that is missing its journey prefix', () => {
    expect(cardHref({ link: '/paths/path-1', type: 'Path' }, debugLocation)).toBe('')
  })

  it('rewrites an absolute debug-port journey URL', () => {
    expect(cardHref({
      link: 'http://127.0.0.1:8392/mentee/event/event-1?tab=notes',
      type: 'Event',
    }, debugLocation)).toBe(
      'http://127.0.0.1:8080/mentee/event/event-1?tab=notes',
    )
  })

  it('keeps an external absolute learning-resource URL unchanged', () => {
    const external = 'https://developer.mozilla.org:8443/en-US/docs/Web/Vue#guide'

    expect(cardHref({ link: external, type: 'Resource' }, debugLocation)).toBe(external)
  })
})
