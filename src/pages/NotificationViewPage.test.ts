import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import NotificationViewPage from './NotificationViewPage.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '665f1c2a9b1e4c0a1b2c3d21' } }),
}))

const MhCardStub = defineComponent({
  name: 'MhCard',
  props: {
    title: { type: String, default: '' },
    automationId: { type: String, default: '' },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'article',
        { 'data-automation-id': props.automationId },
        [
          h('h2', props.title),
          slots.default?.(),
        ],
      )
  },
})

describe('NotificationViewPage', () => {
  it('renders placeholder text for the notification id route', () => {
    const wrapper = mount(NotificationViewPage, {
      global: {
        stubs: {
          MhCard: MhCardStub,
          VContainer: { template: '<div><slot /></div>' },
          VRow: { template: '<div><slot /></div>' },
          VCol: { template: '<div><slot /></div>' },
        },
      },
    })

    expect(wrapper.get('[data-automation-id="notification-view-card"]').exists()).toBe(true)
    expect(wrapper.get('[data-automation-id="notification-view-placeholder"]').text())
      .toBe('Notification details will appear here.')
    expect(wrapper.get('[data-automation-id="notification-view-id"]').text())
      .toBe('665f1c2a9b1e4c0a1b2c3d21')
  })
})
