<script lang="ts" setup>
defineProps<{ current: CampaignFull }>()
</script>

<template>
  <div class="space-y-6">
    <div class="flex gap-4 items-center">
      <h2>{{ $t('general.homebrew', 2) }}</h2>
      <Icon
        v-tippy="{
          content: `${$t('general.monster', 2)}, ${$t('general.player', 2)}, ${$t('general.npc', 2)}, ${$t('general.summon', 2)} & ${$t('general.lair')}`,
          delay: 0,
        }"
        name="tabler:info-circle"
        aria-hidden="true"
        class="size-5 text-slate-300"
      />
      <div class="hidden md:flex gap-1 body-extra-small" />
    </div>
    <Homebrews :campaign="current" />
  </div>
</template>
