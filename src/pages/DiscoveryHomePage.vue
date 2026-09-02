<template>
  <v-container fluid>
    <h1
      class="text-h4 mb-4"
      :data-automation-id="`discovery-${source}-heading`"
    >
      {{ pageTitle }}
    </h1>

    <v-row
      v-if="showToolbar"
      align="center"
      class="mb-4"
      :data-automation-id="`discovery-${source}-toolbar`"
    >
      <v-col cols="12" sm="3" class="d-none d-sm-flex" />
      <v-col cols="12" sm="6" class="d-flex justify-center">
        <div v-if="showSearch" class="w-100" style="max-width: 480px;">
          <ListPageSearch
            :searchable="true"
            :search-query="searchQuery"
            :debounced-search="debouncedSearch"
            :automation-id="`discovery-${source}-search`"
          />
        </div>
      </v-col>
      <v-col cols="12" sm="3" class="d-flex justify-end ga-2">
        <template v-if="source === 'home'">
          <v-btn
            v-if="hasRole('coordinator').value"
            color="primary"
            variant="elevated"
            :href="createActionHref('inviteMember')"
            data-automation-id="discovery-home-invite-member-button"
          >
            Invite Member
          </v-btn>
          <v-btn
            v-if="hasRole('customer').value"
            color="primary"
            variant="elevated"
            :href="createActionHref('inviteCoordinator')"
            data-automation-id="discovery-home-invite-coordinator-button"
          >
            Invite Coordinator
          </v-btn>
        </template>
        <template v-else-if="hasRole('mentor').value">
          <v-btn
            v-if="source === 'resources'"
            color="primary"
            variant="elevated"
            :href="createActionHref('newResource')"
            data-automation-id="discovery-resources-new-button"
          >
            New Resource
          </v-btn>
          <v-btn
            v-if="source === 'paths'"
            color="primary"
            variant="elevated"
            :href="createActionHref('newPath')"
            data-automation-id="discovery-paths-new-button"
          >
            New Path
          </v-btn>
          <v-btn
            v-if="source === 'plans'"
            color="primary"
            variant="elevated"
            :href="createActionHref('newPlan')"
            data-automation-id="discovery-plans-new-button"
          >
            New Plan
          </v-btn>
        </template>
      </v-col>
    </v-row>

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
import { ListPageSearch } from '@mentor-forge/mentorhub_spa_utils'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { Card } from '@/api/types'
import CardGrid from '@/components/CardGrid.vue'
import DiscoveryCard from '@/components/DiscoveryCard.vue'
import { useCards, type CardListSource } from '@/composables/useCards'
import { useRoles } from '@/composables/useRoles'
import { createActionHref } from '@/utils/createActionHref'

const route = useRoute()
const source = computed<CardListSource>(() => route.meta.cardSource as CardListSource)
const pageTitle = computed(() => route.meta.title as string)
const { hasRole } = useRoles()
const showSearch = computed(() => source.value !== 'home' && source.value !== 'events')
const showToolbar = computed(
  () =>
    showSearch.value ||
    (source.value === 'home' &&
      (hasRole('coordinator').value || hasRole('customer').value)),
)
const {
  data: cards,
  isLoading,
  error,
  dismissNotification,
  dismissError,
  searchQuery,
  debouncedSearch,
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
