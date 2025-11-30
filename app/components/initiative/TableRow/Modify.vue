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
    <UiButton
      v-if="item.link"
      variant="info-ghost"
      size="icon-sm"
      as-child
    >
      <NuxtLink
        v-tippy="$t('components.actions.link')"
        data-test-link
        :aria-label="$t('components.actions.link')"
        target="_blank"
        :to="item.link"
      >
        <Icon
          name="tabler:link"
          :aria-hidden="true"
        />
      </NuxtLink>
    </UiButton>
    <UiButton
      v-tippy="$t('actions.copy')"
      data-test-copy
      variant="help-ghost"
      size="icon-sm"
      :disabled="maxCharacters"
      :aria-label="$t('actions.copy')"
      @click="copyRow"
    >
      <Icon
        name="tabler:copy"
        :aria-hidden="true"
      />
    </UiButton>
    <UiButton
      v-tippy="$t('actions.delete')"
      data-test-delete
      variant="destructive-ghost"
      size="icon-sm"
      :aria-label="$t('actions.delete')"
      @click="deleteRow"
    >
      <Icon
        name="tabler:trash"
        :aria-hidden="true"
      />
    </UiButton>
  </div>
</template>
