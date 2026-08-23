import { mount } from '@vue/test-utils'
import { defineComponent, h, type Slots } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Card } from '@/api/types'
import DiscoveryCard from './DiscoveryCard.vue'

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

const VBtnStub = defineComponent({
  name: 'VBtn',
  setup(_, { attrs }) {
    return () => h('button', attrs)
  },
})

function mountCard(card: Card) {
  return mount(DiscoveryCard, {
    props: { card },
    global: {
      stubs: {
        MhCard: MhCardStub,
        VIcon: VIconStub,
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
    expect(wrapper.get('[data-automation-id="discovery-card-resource-1-body-display"] strong').text())
      .toBe('guide')
  })

  it('opens a linked card from either its title or body', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountCard({
      _id: 'path-1',
      name: 'Path',
      description: 'Body',
      link: '/paths/path-1',
      type: 'Path',
    })

    expect(wrapper.get('.discovery-card').attributes('role')).toBe('link')
    expect(wrapper.get('.discovery-card').attributes('tabindex')).toBe('0')

    await wrapper.get('[data-automation-id="discovery-card-path-1-title-display"]').trigger('click')
    await wrapper.get('[data-automation-id="discovery-card-path-1-body-display"]').trigger('click')

    expect(open).toHaveBeenCalledTimes(2)
    expect(open).toHaveBeenNthCalledWith(1, '/paths/path-1', '_self')
  })

  it('opens a linked card with the Enter key', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mountCard({ _id: 'event-1', link: '/events/event-1', type: 'Event' })

    await wrapper.get('.discovery-card').trigger('keydown', { key: 'Enter' })

    expect(open).toHaveBeenCalledWith('/events/event-1', '_self')
  })

  it('emits dismiss for a Notification without following its link', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    const card: Card = {
      _id: 'notification-1',
      name: 'Reminder',
      link: '/reminders/1',
      type: 'Notification',
    }
    const wrapper = mountCard(card)

    await wrapper.get('[data-automation-id="discovery-card-notification-1-dismiss-button"]')
      .trigger('click')

    expect(wrapper.emitted('dismiss')).toEqual([[card]])
    expect(open).not.toHaveBeenCalled()
  })

  it('does not navigate or render undefined when link and description are missing', async () => {
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
