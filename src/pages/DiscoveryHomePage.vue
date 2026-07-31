<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h4 mb-4" data-automation-id="discovery-home-heading">
          Discovery landing (stub)
        </h1>
        <p class="text-body-1 mb-6" data-automation-id="discovery-home-description">
          Placeholder for F-DS01 polymorphic CardGrid. Cards will surface cross-SPA links and
          discovery content here.
        </p>
      </v-col>
    </v-row>

    <CardGrid automation-id="discovery-home-grid">
      <MhCard
        title="Coming soon"
        automation-id="discovery-home-placeholder-card"
      >
        <p class="text-body-2 mb-0" data-automation-id="discovery-home-placeholder-text">
          CardGrid scaffolding is wired; domain cards arrive in F-DS01.
        </p>
      </MhCard>
    </CardGrid>
  </v-container>
</template>

<script setup lang="ts">
import { CardGrid, MhCard } from '@mentor-forge/mentorhub_spa_utils'
</script>
