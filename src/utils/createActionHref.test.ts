import { describe, expect, it } from 'vitest'
import { createActionHref, type CreateAction } from './createActionHref'

const debugLocation = new URL('http://127.0.0.1:8398/discovery/')

describe('createActionHref', () => {
  it.each([
    ['inviteMember', '/customer/members/'],
    ['inviteCoordinator', '/customer/coordinators/'],
    ['newResource', '/mentor/resource'],
    ['newPath', '/mentor/path'],
    ['newPlan', '/mentor/plan'],
  ] as const)('resolves %s to %s through the welcome origin', (action: CreateAction, expectedPath: string) => {
    const href = createActionHref(action, debugLocation)

    expect(href).toBe(`http://127.0.0.1:8080${expectedPath}`)
    expect(href).not.toMatch(/:(?:8398|8388|8392|8394)\b/)
    expect(href).not.toContain('/new')
  })

  it('resolves href without explicit location argument', () => {
    const href = createActionHref('inviteMember')
    expect(href).toContain('/customer/members/')
    expect(href.endsWith('/')).toBe(true)
  })
})
