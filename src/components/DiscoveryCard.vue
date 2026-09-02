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
import { cardHref } from '@/utils/cardHref'
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
const href = computed(() => cardHref(props.card))
const hasLink = computed(() => Boolean(href.value))

function openLink() {
  if (href.value) {
    window.open(href.value, '_self')
  }
}
</script>

<style scoped>
.discovery-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.discovery-card--linked {
  cursor: pointer;
}
</style>
