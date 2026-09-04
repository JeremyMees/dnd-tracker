<script setup lang="ts">
const { stats, open, dismiss } = useLiveSummary()
</script>

<template>
  <UiDialog
    :open="open && !!stats"
    @update:open="(value: boolean) => !value && dismiss()"
  >
    <UiDialogScrollContent test-id="live-summary" class="max-w-2xl">
      <UiDialogHeader>
        <UiDialogTitle>
          {{ $t('components.combatSummary.title') }}
        </UiDialogTitle>
        <UiDialogDescription>
          {{ $t('components.combatSummary.description') }}
        </UiDialogDescription>
      </UiDialogHeader>

      <CombatSummaryStats v-if="stats" :stats="stats" />

      <UiDialogFooter>
        <UiButton test-id="dismiss" @click="dismiss">
          <Icon name="tabler:check" aria-hidden="true" />
          {{ $t('actions.close') }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogScrollContent>
  </UiDialog>
</template>
