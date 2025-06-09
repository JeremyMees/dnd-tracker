<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const maxCharacters = computed(() => hasMaxCharacters(sheet.value))

function copyRow(): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1) return

  update({
    rows: [
      ...rows,
      { ...props.item, id: crypto.randomUUID() },
    ],
  })
}

function deleteRow(): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  let rows = [...sheet.value.rows]

  if (index === -1) return

  rows = rows.filter(r => r.id !== props.item.id)

  update({ rows })
}
</script>

<template>
  <div class="flex items-center justify-end">
    <NuxtLink
      v-if="item.link"
      v-tippy="$t('components.actions.link')"
      data-test-link
      :aria-label="$t('components.actions.link')"
      class="icon-btn-info"
      target="_blank"
      :to="item.link"
    >
      <Icon
        name="tabler:link"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </NuxtLink>
    <button
      v-tippy="$t('actions.copy')"
      data-test-copy
      :disabled="maxCharacters"
      :aria-label="$t('actions.copy')"
      class="icon-btn-help"
      @click="copyRow"
    >
      <Icon
        name="tabler:copy"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </button>
    <button
      v-tippy="$t('actions.delete')"
      data-test-delete
      :aria-label="$t('actions.delete')"
      class="icon-btn-destructive"
      @click="deleteRow"
    >
      <Icon
        name="tabler:trash"
        :aria-hidden="true"
        class="size-5 min-w-5"
      />
    </button>
  </div>
</template>
