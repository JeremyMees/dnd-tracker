<script lang="ts" setup>
defineProps<{ current: CampaignFull }>()
</script>

<template>
  <div class="space-y-6">
    <h2>
      {{ $t('general.encounter', 2) }}
    </h2>
    <Encounters :campaign="current" />
  </div>
</template>
