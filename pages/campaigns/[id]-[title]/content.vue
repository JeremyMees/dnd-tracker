<script lang="ts" setup>
defineProps<{ current: CampaignFull }>()

const { t } = useI18n()
</script>

<template>
  <div class="space-y-20">
    <div class="space-y-6">
      <h2>
        {{ t('general.encounters') }}
      </h2>
      <Encounters :campaign-id="current.id" />
    </div>
    <div class="space-y-6">
      <div class="flex gap-4 items-center">
        <h2>{{ t('general.homebrew') }}</h2>
        <Icon
          v-tippy="{
            content: `${t('general.monsters')}, ${t('general.players')}, ${t('general.npcs')}, ${t('general.summons')} & ${t('general.lair')}`,
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
