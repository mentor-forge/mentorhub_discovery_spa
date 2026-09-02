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
    getEventCards: vi.fn(),
    getMemberCards: vi.fn(),
    getResourceCards: vi.fn(),
    getPathCards: vi.fn(),
    getPlanCards: vi.fn(),
    getProductCards: vi.fn(),
    getNotificationCards: vi.fn(),
    dismissNotification: vi.fn(),
    cancelNotification: vi.fn(),
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
    ['events', 'getEventCards'],
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

  it('cancels a notification and invalidates every card query', async () => {
    vi.mocked(api.getHomeCards).mockResolvedValue(cards)
    vi.mocked(api.cancelNotification).mockResolvedValue({
      _id: 'notification-1',
      cancelled: {
        from_ip: '127.0.0.1',
        by_user: 'test-admin',
        at_time: '2026-09-01T20:00:00Z',
        correlation_id: 'test-correlation-id',
      },
    })
    const { composable, queryClient, wrapper } = mountCards('home')
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await vi.waitFor(() => {
      expect(composable.isSuccess.value).toBe(true)
    })
    await composable.cancelNotification('notification-1')

    expect(api.cancelNotification).toHaveBeenCalledWith('notification-1')
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

  it('keeps events pagination-only with the events query key', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(api.getEventCards).mockResolvedValue(cards)
      const { composable, queryClient, wrapper } = mountCards('events')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })

      expect(queryClient.getQueryData(['cards', 'events'])).toEqual(cards)
      composable.debouncedSearch('ignored-term')
      await vi.advanceTimersByTimeAsync(300)

      expect(api.getEventCards).toHaveBeenCalledOnce()
      expect(api.getEventCards).toHaveBeenCalledWith(0, 20)
      expect(queryClient.getQueryData(['cards', 'events', 'ignored-term'])).toBeUndefined()

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('filters notification cards client-side by name and never passes name to the API', async () => {
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
      expect(api.getNotificationCards).toHaveBeenCalledWith(0, 20)

      composable.debouncedSearch('welcome')
      await vi.advanceTimersByTimeAsync(300)

      await vi.waitFor(() => {
        expect(composable.data.value).toEqual([notifs[0]])
      })

      // Adversarial: notifications must stay pagination-only on the wire.
      for (const call of vi.mocked(api.getNotificationCards).mock.calls) {
        expect(call).toEqual([0, 20])
      }

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('resets search when the card source changes', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(api.getResourceCards).mockResolvedValue(cards)
      vi.mocked(api.getPathCards).mockResolvedValue(cards)

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const source = ref<CardListSource>('resources')
      let composable!: ReturnType<typeof useCards>

      const wrapper = mount(
        defineComponent({
          setup() {
            composable = useCards(source)
            return () => h('div')
          },
        }),
        {
          global: {
            plugins: [[VueQueryPlugin, { queryClient }]],
          },
        },
      )

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })

      composable.debouncedSearch('Vue')
      await vi.advanceTimersByTimeAsync(300)
      await vi.waitFor(() => {
        expect(api.getResourceCards).toHaveBeenCalledWith(0, 20, 'Vue')
      })

      source.value = 'paths'
      await vi.waitFor(() => {
        expect(composable.searchQuery.value).toBe('')
        expect(api.getPathCards).toHaveBeenCalledWith(0, 20)
      })
      expect(api.getPathCards).not.toHaveBeenCalledWith(0, 20, 'Vue')

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps a slower previous search response from overwriting a newer query key', async () => {
    vi.useFakeTimers()
    try {
      let resolveVue!: (value: Card[]) => void
      let resolveReact!: (value: Card[]) => void

      vi.mocked(api.getResourceCards).mockImplementation((_offset, _size, name?) => {
        if (name === 'Vue') {
          return new Promise((resolve) => {
            resolveVue = resolve
          })
        }
        if (name === 'React') {
          return new Promise((resolve) => {
            resolveReact = resolve
          })
        }
        return Promise.resolve(cards)
      })

      const { composable, queryClient, wrapper } = mountCards('resources')

      await vi.waitFor(() => {
        expect(composable.isSuccess.value).toBe(true)
      })

      composable.debouncedSearch('Vue')
      await vi.advanceTimersByTimeAsync(300)

      composable.debouncedSearch('React')
      await vi.advanceTimersByTimeAsync(300)

      // Newer search resolves first.
      resolveReact([{ _id: 'react-1', name: 'React', type: 'Resource' }])
      await vi.waitFor(() => {
        expect(composable.data.value?.[0]?.name).toBe('React')
      })

      // Stale Vue response must not replace the active React result.
      resolveVue([{ _id: 'vue-1', name: 'Vue', type: 'Resource' }])
      await vi.waitFor(() => {
        expect(composable.data.value?.[0]?.name).toBe('React')
      })

      wrapper.unmount()
      queryClient.clear()
    } finally {
      vi.useRealTimers()
    }
  })
})
