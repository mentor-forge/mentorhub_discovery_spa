<template>
  <div
    class="discovery-card"
    :class="{ 'discovery-card--linked': hasLink }"
    :role="hasLink ? 'link' : undefined"
    :tabindex="hasLink ? 0 : undefined"
    @click="openLink"
    @keydown.enter="openLink"
  >
    <MhCard
      :title="card.name ?? ''"
      :color="appearance.color"
      :automation-id="automationId"
    >
      <template #actions>
        <v-icon
          :icon="appearance.icon"
          :aria-label="card.type ? `${card.type} card` : 'Card'"
          :data-automation-id="`${automationId}-type-icon`"
        />
        <v-btn
          v-if="card.type === 'Notification'"
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Dismiss notification"
          :data-automation-id="`${automationId}-dismiss-button`"
          @click.stop="emit('dismiss', card)"
        />
      </template>

      <div :data-automation-id="`${automationId}-body-display`">
        <MarkdownView :source="card.description ?? ''" />
      </div>
    </MhCard>
  </div>
</template>

<script setup lang="ts">
import { MhCard } from '@mentor-forge/mentorhub_spa_utils'
import { computed } from 'vue'
import type { Card } from '@/api/types'
import { cardAppearance } from '@/utils/cardAppearance'
import MarkdownView from './MarkdownView.vue'

interface Props {
  card: Card
}

const props = defineProps<Props>()

const emit = defineEmits<{
  dismiss: [card: Card]
}>()

const appearance = computed(() => cardAppearance(props.card.type))
const automationId = computed(() => `discovery-card-${props.card._id ?? 'unknown'}`)
const hasLink = computed(() => Boolean(props.card.link))

function openLink() {
  if (props.card.link) {
    window.open(props.card.link, '_self')
  }
}
</script>

<style scoped>
.discovery-card--linked {
  cursor: pointer;
}
</style>
