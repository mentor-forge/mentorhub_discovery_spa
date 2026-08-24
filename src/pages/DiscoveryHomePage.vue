<template>
  <v-container>
    <h1
      class="text-h4 mb-4"
      :data-automation-id="`discovery-${source}-heading`"
    >
      {{ pageTitle }}
    </h1>

    <div
      v-if="isLoading"
      :data-automation-id="`discovery-${source}-loading`"
    >
      Loading cards…
    </div>

    <v-alert
      v-else-if="error"
      type="error"
      :data-automation-id="`discovery-${source}-error`"
    >
      {{ errorMessage }}
    </v-alert>

    <div
      v-else-if="!cards?.length"
      :data-automation-id="`discovery-${source}-empty`"
    >
      No cards to display.
    </div>

    <CardGrid
      v-else
      :automation-id="`discovery-${source}-grid`"
    >
      <DiscoveryCard
        v-for="card in cards"
        :key="card._id ?? `${card.type}-${card.name}`"
        :card="card"
        @dismiss="handleDismiss"
      >
      </DiscoveryCard>
    </CardGrid>

    <v-alert
      v-if="dismissError"
      class="mt-4"
      type="error"
      :data-automation-id="`discovery-${source}-dismiss-error`"
    >
      {{ dismissErrorMessage }}
    </v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { CardGrid } from '@mentor-forge/mentorhub_spa_utils'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Card } from '@/api/types'
import DiscoveryCard from '@/components/DiscoveryCard.vue'
import { useCards, type CardListSource } from '@/composables/useCards'

const route = useRoute()
const source = computed<CardListSource>(() => route.meta.cardSource as CardListSource)
const pageTitle = computed(() => route.meta.title as string)
const {
  data: cards,
  isLoading,
  error,
  dismissNotification,
  dismissError,
} = useCards(source)

const errorMessage = computed(() =>
  error.value instanceof Error ? error.value.message : 'Unable to load cards.',
)
const dismissErrorMessage = computed(() =>
  dismissError.value instanceof Error
    ? dismissError.value.message
    : 'Unable to dismiss notification.',
)

async function handleDismiss(card: Card) {
  if (!card._id) {
    return
  }

  try {
    await dismissNotification(card._id)
  } catch {
    // The mutation error is rendered above.
  }
}
</script>
