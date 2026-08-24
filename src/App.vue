<template>
  <v-app>
    <PageFrame page-title="Discovery">
      <router-view />
    </PageFrame>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, type ComputedRef } from 'vue'
import {
  PageFrame,
  provideEditorConfig,
  type RuntimeEditorConfig,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'
import { useConfig } from '@/composables/useConfig'

const { isAuthenticated } = useAuth()
const { config, loadConfig } = useConfig()

provideEditorConfig(config as unknown as ComputedRef<RuntimeEditorConfig | null>)

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      console.warn('Failed to load config on mount:', error)
    }
  }
})
</script>
