import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { Card } from '@/api/types'

export type CardListSource =
  | 'home'
  | 'events'
  | 'members'
  | 'resources'
  | 'paths'
  | 'plans'
  | 'products'
  | 'notifications'

const DEFAULT_OFFSET = 0
const DEFAULT_SIZE = 20

const listRequests: Record<
  CardListSource,
  (offset: number, size: number, name?: string) => Promise<Card[]>
> = {
  home: (offset, size) => api.getHomeCards(offset, size),
  events: (offset, size) => api.getEventCards(offset, size),
  members: api.getMemberCards,
  resources: api.getResourceCards,
  paths: api.getPathCards,
  plans: api.getPlanCards,
  products: api.getProductCards,
  notifications: (offset, size) => api.getNotificationCards(offset, size),
}

export function useCards(source: MaybeRefOrGetter<CardListSource>) {
  const queryClient = useQueryClient()
  const resolvedSource = computed(() => toValue(source))

  const searchQuery = ref('')
  const debouncedQuery = ref('')

  let searchTimeout: ReturnType<typeof setTimeout> | undefined
  const debouncedSearch = (value: string | null) => {
    const raw = value ?? ''
    searchQuery.value = raw
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    searchTimeout = setTimeout(() => {
      debouncedQuery.value = raw
    }, 300)
  }

  watch(resolvedSource, () => {
    searchQuery.value = ''
    debouncedQuery.value = ''
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })

  const trimmedSearch = computed(() => debouncedQuery.value.trim())

  const queryKey = computed(() => {
    const currentSource = resolvedSource.value
    if (currentSource !== 'home' && currentSource !== 'events' && trimmedSearch.value) {
      return ['cards', currentSource, trimmedSearch.value]
    }
    return ['cards', currentSource]
  })

  const cardsQuery = useQuery<Card[]>({
    queryKey,
    queryFn: async () => {
      const currentSource = resolvedSource.value
      const search =
        currentSource !== 'home' && currentSource !== 'events'
          ? trimmedSearch.value || undefined
          : undefined

      if (currentSource === 'notifications') {
        const list = await api.getNotificationCards(DEFAULT_OFFSET, DEFAULT_SIZE)
        if (search) {
          const lower = search.toLowerCase()
          return list.filter((c) => c.name?.toLowerCase().includes(lower))
        }
        return list
      }

      if (search) {
        return listRequests[currentSource](DEFAULT_OFFSET, DEFAULT_SIZE, search)
      }
      return listRequests[currentSource](DEFAULT_OFFSET, DEFAULT_SIZE)
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) => api.dismissNotification(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: (notificationId: string) => api.cancelNotification(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  })

  return {
    ...cardsQuery,
    searchQuery,
    debouncedSearch,
    dismissNotification: dismissMutation.mutateAsync,
    isDismissing: dismissMutation.isPending,
    dismissError: dismissMutation.error,
    cancelNotification: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error,
  }
}
