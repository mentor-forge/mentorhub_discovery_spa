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

  it('passes debounced name search to typed lists and updates query key', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(api.getResourceCards).mockResolvedValue(cards)
      const { composable, queryClient, wrapper } = mountCards('resources')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })
      expect(api.getResourceCards).toHaveBeenCalledWith(0, 20)

      composable.debouncedSearch('TypeScript')
      expect(composable.searchQuery.value).toBe('TypeScript')

      // Before 300ms, debounced query has not fired
      expect(api.getResourceCards).toHaveBeenCalledTimes(1)

      // Advance timers past 300ms debounce
      await vi.advanceTimersByTimeAsync(300)

      await vi.waitFor(() => {
        expect(api.getResourceCards).toHaveBeenCalledWith(0, 20, 'TypeScript')
      })

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('omits name query when search is blank or whitespace only', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(api.getPathCards).mockResolvedValue(cards)
      const { composable, queryClient, wrapper } = mountCards('paths')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })

      composable.debouncedSearch('   ')
      await vi.advanceTimersByTimeAsync(300)

      await vi.waitFor(() => {
        expect(api.getPathCards).toHaveBeenLastCalledWith(0, 20)
      })

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('home list never passes name parameter even if search is called', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(api.getHomeCards).mockResolvedValue(cards)
      const { composable, queryClient, wrapper } = mountCards('home')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })

      composable.debouncedSearch('ignored-term')
      await vi.advanceTimersByTimeAsync(300)

      expect(api.getHomeCards).toHaveBeenCalledWith(0, 20)

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('filters notification cards client-side by name', async () => {
    vi.useFakeTimers()
    try {
      const notifs: Card[] = [
        { _id: 'n1', name: 'Welcome Alert', type: 'Notification' },
        { _id: 'n2', name: 'System Maintenance', type: 'Notification' },
      ]
      vi.mocked(api.getNotificationCards).mockResolvedValue(notifs)
      const { composable, queryClient, wrapper } = mountCards('notifications')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })
      expect(composable.data.value).toEqual(notifs)

      composable.debouncedSearch('welcome')
      await vi.advanceTimersByTimeAsync(300)

      await vi.waitFor(() => {
        expect(composable.data.value).toEqual([notifs[0]])
      })

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })
})
