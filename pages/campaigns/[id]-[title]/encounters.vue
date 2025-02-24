<script lang="ts" setup>
import Encounters from '~/components/templates/Encounters.vue'

defineProps<{ current: CampaignFull }>()
</script>

<template>
  <Encounters :campaign="current" />
</template>
