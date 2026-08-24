import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import type { Card } from '@/api/types'

export type CardListSource =
  | 'home'
  | 'members'
  | 'resources'
  | 'paths'
  | 'plans'
  | 'products'
  | 'notifications'

const DEFAULT_OFFSET = 0
const DEFAULT_SIZE = 20

const listRequests: Record<CardListSource, (offset: number, size: number) => Promise<Card[]>> = {
  home: api.getHomeCards,
  members: api.getMemberCards,
  resources: api.getResourceCards,
  paths: api.getPathCards,
  plans: api.getPlanCards,
  products: api.getProductCards,
  notifications: api.getNotificationCards,
}

export function useCards(source: MaybeRefOrGetter<CardListSource>) {
  const queryClient = useQueryClient()
  const resolvedSource = computed(() => toValue(source))

  const cardsQuery = useQuery<Card[]>({
    queryKey: computed(() => ['cards', resolvedSource.value]),
    queryFn: () => listRequests[resolvedSource.value](DEFAULT_OFFSET, DEFAULT_SIZE),
  })

  const dismissMutation = useMutation({
    mutationFn: (notificationId: string) => api.dismissNotification(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards'] }),
  })

  return {
    ...cardsQuery,
    dismissNotification: dismissMutation.mutateAsync,
    isDismissing: dismissMutation.isPending,
    dismissError: dismissMutation.error,
  }
}
