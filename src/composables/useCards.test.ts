import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import type { Card } from '@/api/types'
import { useCards, type CardListSource } from './useCards'

vi.mock('@/api/client', () => ({
  api: {
    getHomeCards: vi.fn(),
    getMemberCards: vi.fn(),
    getResourceCards: vi.fn(),
    getPathCards: vi.fn(),
    getPlanCards: vi.fn(),
    getProductCards: vi.fn(),
    getNotificationCards: vi.fn(),
    dismissNotification: vi.fn(),
  },
}))

const cards: Card[] = [{ _id: 'card-1', name: 'Card', type: 'Resource' }]

function mountCards(source: CardListSource) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  let composable!: ReturnType<typeof useCards>

  const wrapper = mount(
    defineComponent({
      setup() {
        composable = useCards(ref(source))
        return () => h('div')
      },
    }),
    {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    },
  )

  return { composable, queryClient, wrapper }
}

describe('useCards', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['home', 'getHomeCards'],
    ['members', 'getMemberCards'],
    ['resources', 'getResourceCards'],
    ['paths', 'getPathCards'],
    ['plans', 'getPlanCards'],
    ['products', 'getProductCards'],
    ['notifications', 'getNotificationCards'],
  ] as const)('loads the first %s card page', async (source, method) => {
    vi.mocked(api[method]).mockResolvedValue(cards)
    const { composable, queryClient, wrapper } = mountCards(source)

    await vi.waitFor(() => {
      expect(composable.isSuccess.value).toBe(true)
    })

    expect(api[method]).toHaveBeenCalledWith(0, 20)
    expect(composable.data.value).toEqual(cards)

    wrapper.unmount()
    queryClient.clear()
  })

  it('dismisses a notification and invalidates every card query', async () => {
    vi.mocked(api.getHomeCards).mockResolvedValue(cards)
    vi.mocked(api.dismissNotification).mockResolvedValue({
      _id: 'notification-1',
      status: 'archived',
    })
    const { composable, queryClient, wrapper } = mountCards('home')
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await vi.waitFor(() => {
      expect(composable.isSuccess.value).toBe(true)
    })
    await composable.dismissNotification('notification-1')

    expect(api.dismissNotification).toHaveBeenCalledWith('notification-1')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['cards'] })

    wrapper.unmount()
    queryClient.clear()
  })
})
