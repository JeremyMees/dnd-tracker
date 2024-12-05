<script lang="ts" setup>
const props = defineProps<{ current: CampaignFull }>()

const { t } = useI18n()
</script>

<template>
  <div>
    <h1 class="pb-6">
      {{ t('general.encounters') }}
    </h1>
    <Encounters :campaign-id="current.id" />
  </div>
</template>
