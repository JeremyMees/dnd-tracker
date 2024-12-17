<script lang="ts" setup>
defineProps<{ current: CampaignFull }>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-20">
    <div class="space-y-6">
      <h2>
        {{ t('general.encounter', 2) }}
      </h2>
      <Encounters :campaign-id="current.id" />
    </div>
    <div class="space-y-6">
      <div class="flex gap-4 items-center">
        <h2>{{ t('general.homebrew', 2) }}</h2>
        <Icon
          v-tippy="{
            content: `${t('general.monster', 2)}, ${t('general.player', 2)}, ${t('general.npc', 2)}, ${t('general.summon', 2)} & ${t('general.lair')}`,
            delay: 0,
          }"
          name="material-symbols:info-outline-rounded"
          aria-hidden="true"
          class="size-5 text-slate-300"
        />
        <div class="hidden md:flex gap-1 body-extra-small" />
      </div>
      <Homebrews :campaign="current" />
    </div>
  </div>
</template>
