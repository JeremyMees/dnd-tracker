<script setup lang="ts">
const props = defineProps<{
  sheet?: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>) => Promise<void>
}>()

const isModified = computed(() => props.sheet?.settings?.modified ?? false)

const widgets = computed(() => {
  const allowed = ['note', 'info-pins']
  const data = props.sheet?.settings?.widgets ?? []
  return allowed.filter(widget => data.includes(widget))
})
</script>

<template>
  <div
    v-if="widgets.length || !isModified"
    class="pt-4 space-y-2"
  >
    <h3>
      {{ $t('general.widget', 2) }}
    </h3>
    <div class="grid xl:grid-cols-2 gap-2 items-start">
      <InitiativeWidgetsNote
        v-if="widgets.includes('note') || !isModified"
        :value="sheet?.info ?? ''"
        @update="update({ info: $event })"
      />
      <InitiativeWidgetsPinnedContent
        v-if="widgets.includes('info-pins') || !isModified"
        :value="sheet?.info_cards ?? []"
        @update="update({ info_cards: $event })"
      />
    </div>
  </div>
</template>
