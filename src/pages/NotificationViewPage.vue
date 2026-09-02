<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <MhCard title="Notification" automation-id="notification-view-card">
          <p class="text-body-1" data-automation-id="notification-view-placeholder">
            Notification details will appear here.
          </p>
          <p class="text-medium-emphasis" data-automation-id="notification-view-id">
            {{ notificationId }}
          </p>
        </MhCard>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { MhCard } from '@mentor-forge/mentorhub_spa_utils'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const notificationId = computed(() => route.params.id as string)
</script>
