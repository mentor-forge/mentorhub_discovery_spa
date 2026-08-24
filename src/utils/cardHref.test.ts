import { describe, expect, it } from 'vitest'
import { cardHref } from './cardHref'

const debugLocation = new URL('http://127.0.0.1:8398/discovery/')

describe('cardHref', () => {
  it.each([
    [{ _id: 'member-1', type: 'Member' as const }, '/customer/members/member-1'],
    [{ link: '/settings' }, '/admin/settings'],
    [{ _id: 'path-1', link: '/paths/path-1', type: 'Path' as const }, '/mentor/paths/path-1'],
    [{ link: '/mentee/profile' }, '/mentee/profile'],
  ])('composes %j through the welcome origin', (card, expectedPath) => {
    const href = cardHref(card, debugLocation)

    expect(href).toBe(`http://127.0.0.1:8080${expectedPath}`)
    expect(href).not.toMatch(/:(?:8398|8388|8392|8394)\b/)
  })

  it('rewrites an absolute debug-port journey URL', () => {
    expect(cardHref({
      link: 'http://127.0.0.1:8392/mentee/events/event-1?tab=notes',
      type: 'Event',
    }, debugLocation)).toBe(
      'http://127.0.0.1:8080/mentee/events/event-1?tab=notes',
    )
  })

  it('keeps an external absolute learning-resource URL unchanged', () => {
    const external = 'https://developer.mozilla.org:8443/en-US/docs/Web/Vue#guide'

    expect(cardHref({ link: external, type: 'Resource' }, debugLocation)).toBe(external)
  })
})
