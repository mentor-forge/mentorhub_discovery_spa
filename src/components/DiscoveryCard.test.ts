import { mount } from '@vue/test-utils'
import { computed, defineComponent, h, type Slots } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Card } from '@/api/types'
import DiscoveryCard from './DiscoveryCard.vue'

const roleState = vi.hoisted(() => ({ roles: [] as string[] }))

vi.mock('@/composables/useRoles', () => ({
  useRoles: () => ({
    hasRole: (role: string) => computed(() => roleState.roles.includes(role)),
  }),
}))

const MhCardStub = defineComponent({
  name: 'MhCard',
  props: {
    title: { type: String, default: '' },
    color: { type: String, default: '' },
    automationId: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'article',
        {
          'data-automation-id': props.automationId,
          'data-color': props.color,
        },
        [
          h(
            'h2',
            { 'data-automation-id': `${props.automationId}-title-display` },
            props.title,
          ),
          h('div', { class: 'actions' }, renderSlot(slots, 'actions')),
          h('div', { class: 'body' }, renderSlot(slots, 'default')),
        ],
      )
  },
})

function renderSlot(slots: Slots, name: keyof Slots) {
  return slots[name]?.() ?? []
}

const VIconStub = defineComponent({
  name: 'VIcon',
  props: {
    icon: { type: String, default: '' },
  },
  setup(props, { attrs }) {
    return () => h('span', { ...attrs, 'data-icon': props.icon })
  },
})

const VTooltipStub = defineComponent({
  name: 'VTooltip',
  props: {
    text: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () =>
      h('span', { 'data-tooltip': props.text, 'data-location': props.location }, [
        slots.activator?.({
          props: {
            'aria-describedby': 'type-tooltip',
          },
        }),
      ])
  },
})

const VBtnStub = defineComponent({
  name: 'VBtn',
  setup(_, { attrs }) {
    return () => h('button', attrs)
  },
})

function mountCard(card: Card, roles: string[] = []) {
  roleState.roles = roles
  return mount(DiscoveryCard, {
    props: { card },
    global: {
      stubs: {
        MhCard: MhCardStub,
        VIcon: VIconStub,
        VTooltip: VTooltipStub,
        VBtn: VBtnStub,
      },
    },
  })
}

describe('DiscoveryCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders card chrome, type appearance, and markdown description', () => {
    const wrapper = mountCard({
      _id: 'resource-1',
      name: 'Vue Guide',
      description: 'Read the **guide**.',
      type: 'Resource',
    })

    expect(wrapper.get('[data-automation-id="discovery-card-resource-1"]').attributes('data-color'))
      .toBe('green-darken-2')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-title-display"]').text())
      .toBe('Vue Guide')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-type-icon"]').attributes('data-icon'))
      .toBe('mdi-book-open-page-variant')
    expect(wrapper.get('[data-tooltip="Resource"]').attributes('data-location')).toBe('top')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-type-icon"]').classes())
      .toContain('discovery-card__type-icon')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-type-icon"]').attributes('aria-label'))
      .toBe('Resource card')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-type-icon"]').attributes('aria-describedby'))
      .toBe('type-tooltip')
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-body-display"] strong').text())
      .toBe('guide')
  })

  it.each([
    ['missing', undefined],
    ['empty', ''],
  ])('uses a sensible icon hint and accessible name when type is %s', (_, type) => {
    const wrapper = mountCard({ _id: 'untyped-1', type: type as Card['type'] })
    const icon = wrapper.get('[data-automation-id="discovery-card-untyped-1-type-icon"]')

    expect(wrapper.get('[data-tooltip="Card"]').exists()).toBe(true)
    expect(icon.attributes('aria-label')).toBe('Card')
    expect(icon.attributes('data-icon')).toBe('mdi-card-text-outline')
  })

  it('opens a linked card from either its title or body', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountCard({
      _id: 'path-1',
      name: 'Path',
      description: 'Body',
      link: 'mentor/path/path-1',
      type: 'Path',
    })

    expect(wrapper.get('.discovery-card').attributes('role')).toBe('link')
    expect(wrapper.get('.discovery-card').attributes('tabindex')).toBe('0')

    await wrapper.get('[data-automation-id="discovery-card-path-1-title-display"]').trigger('click')
    await wrapper.get('[data-automation-id="discovery-card-path-1-body-display"]').trigger('click')

    expect(open).toHaveBeenCalledTimes(2)
    expect(open).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^http:\/\/localhost:8080\/mentor\/path\/path-1$/),
      '_self',
    )
  })

  it('opens a linked card with the Enter key', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountCard({ _id: 'event-1', link: 'mentee/event/event-1', type: 'Event' })

    await wrapper.get('.discovery-card').trigger('keydown', { key: 'Enter' })

    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/localhost:8080\/mentee\/event\/event-1$/),
      '_self',
    )
  })

  it('shows Dismiss only for a non-admin Notification and does not follow its link', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const card: Card = {
      _id: 'notification-1',
      name: 'Reminder',
      link: '/reminders/1',
      type: 'Notification',
    }
    const wrapper = mountCard(card)

    expect(wrapper.find('[data-automation-id="discovery-card-notification-1-cancel-button"]').exists())
      .toBe(false)
    await wrapper.get('[data-automation-id="discovery-card-notification-1-dismiss-button"]')
      .trigger('click')

    expect(wrapper.emitted('dismiss')).toEqual([[card]])
    expect(open).not.toHaveBeenCalled()
  })

  it('shows Cancel only for an admin Notification and does not follow its link', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const card: Card = {
      _id: 'notification-2',
      name: 'Reminder',
      link: '/reminders/2',
      type: 'Notification',
    }
    const wrapper = mountCard(card, ['admin'])

    expect(wrapper.find('[data-automation-id="discovery-card-notification-2-dismiss-button"]').exists())
      .toBe(false)
    await wrapper.get('[data-automation-id="discovery-card-notification-2-cancel-button"]')
      .trigger('click')

    expect(wrapper.emitted('cancel')).toEqual([[card]])
    expect(open).not.toHaveBeenCalled()
  })

  it('shows neither notification control on a non-Notification card', () => {
    const wrapper = mountCard({
      _id: 'resource-2',
      name: 'Guide',
      type: 'Resource',
    }, ['admin'])

    expect(wrapper.find('[data-automation-id="discovery-card-resource-2-dismiss-button"]').exists())
      .toBe(false)
    expect(wrapper.find('[data-automation-id="discovery-card-resource-2-cancel-button"]').exists())
      .toBe(false)
  })

  it('does not follow a card when the API omitted link', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountCard({ name: 'Unlinked' })

    await wrapper.get('.discovery-card').trigger('click')

    expect(wrapper.get('.discovery-card').attributes('role')).toBeUndefined()
    expect(wrapper.get('.discovery-card').attributes('tabindex')).toBeUndefined()
    expect(wrapper.get('[data-automation-id="discovery-card-unknown-body-display"]').text()).toBe('')
    expect(wrapper.html()).not.toContain('undefined')
    expect(open).not.toHaveBeenCalled()
  })
})
