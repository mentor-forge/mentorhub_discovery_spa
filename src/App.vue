<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon
        v-if="isAuthenticated"
        @click="drawer = !drawer"
        data-automation-id="nav-drawer-toggle"
        aria-label="Open navigation drawer"
      />
      <v-app-bar-title data-automation-id="app-bar-title">{{ appBarTitle }}</v-app-bar-title>
    </v-app-bar>

    <v-navigation-drawer
      v-if="isAuthenticated"
      v-model="drawer"
      temporary
    >
      <v-list density="compact" nav>
        <v-list-item
          to="/"
          prepend-icon="mdi-home"
          title="Home"
          data-automation-id="nav-home-link"
        />
        <v-list-item
          to="/resources"
          prepend-icon="mdi-book-open-page-variant"
          title="Resources"
          data-automation-id="nav-resources-link"
        />
        <v-list-item
          to="/paths"
          prepend-icon="mdi-map-marker-path"
          title="Paths"
          data-automation-id="nav-paths-link"
        />
        <v-list-item
          to="/plans"
          prepend-icon="mdi-clipboard-text"
          title="Plans"
          data-automation-id="nav-plans-link"
        />
      </v-list>

      <template v-slot:append>
        <v-divider />
        <v-list density="compact" nav>
          <v-list-item
            v-if="hasAdminRole"
            to="/admin"
            prepend-icon="mdi-cog"
            title="Admin"
            data-automation-id="nav-admin-link"
          />
          <v-list-item
            @click.stop="handleLogout"
            prepend-icon="mdi-logout"
            title="Logout"
            data-automation-id="nav-logout-link"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  provideEditorConfig,
  redirectToIdpLogin,
  type RuntimeEditorConfig,
  useAuth,
} from '@mentor-forge/mentorhub_spa_utils'
import { useAppTitle } from '@/composables/useAppTitle'
import { useConfig } from '@/composables/useConfig'
import { useRoles } from '@/composables/useRoles'

const router = useRouter()
const { isAuthenticated, logout } = useAuth()
const { config, loadConfig } = useConfig()
const { hasRole } = useRoles()
const { appBarTitle, resetAppBarTitle } = useAppTitle()
const drawer = ref(false)

provideEditorConfig(config as unknown as ComputedRef<RuntimeEditorConfig | null>)

const hasAdminRole = hasRole('admin')

router.afterEach(() => {
  drawer.value = false
})

onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      await loadConfig()
    } catch (error) {
      console.warn('Failed to load config on mount:', error)
    }
  }
})

function handleLogout() {
  const returnTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  resetAppBarTitle()
  logout()
  drawer.value = false
  redirectToIdpLogin(returnTo)
}
</script>
