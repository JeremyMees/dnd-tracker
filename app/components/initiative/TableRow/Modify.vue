<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update, patchRow, portal, claimedRows } =
  validateInject(INITIATIVE_SHEET)

const maxCharacters = computed(() => hasMaxCharacters(sheet.value))
const isEditing = ref(false)
const canHide = computed(() => !!portal?.value && props.item.type !== 'player')
const claimed = computed(
  () => !props.item.hidden && !!claimedRows?.value.has(props.item.id),
)
const visibilityLabel = computed(() => {
  if (claimed.value) return 'general.claimed'

  return props.item.hidden
    ? 'actions.revealToPlayers'
    : 'actions.hideFromPlayers'
})

function copyRow(): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1) return

  update({
    rows: [...rows, { ...props.item, id: crypto.randomUUID() }],
  })
}

function toggleHidden(): void {
  patchRow(props.item.id, { hidden: !props.item.hidden }).catch(() => undefined)
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
    <Tooltip v-if="item.link" :text="$t('components.actions.link')">
      <UiButton variant="info-ghost" size="icon-sm" as-child>
        <NuxtLink
          test-id="link"
          :aria-label="$t('components.actions.link')"
          target="_blank"
          :to="item.link"
        >
          <Icon name="tabler:link" :aria-hidden="true" />
        </NuxtLink>
      </UiButton>
    </Tooltip>
    <Tooltip v-if="canHide" :text="$t(visibilityLabel)">
      <UiButton
        test-id="visibility"
        variant="info-ghost"
        size="icon-sm"
        :disabled="claimed"
        :aria-label="$t(visibilityLabel)"
        @click="toggleHidden"
      >
        <Icon
          :name="item.hidden ? 'tabler:eye' : 'tabler:eye-off'"
          :aria-hidden="true"
        />
      </UiButton>
    </Tooltip>
    <Tooltip :text="$t('actions.edit')">
      <UiButton
        test-id="edit"
        variant="warning-ghost"
        size="icon-sm"
        :aria-label="$t('actions.edit')"
        @click="isEditing = true"
      >
        <Icon name="tabler:pencil" :aria-hidden="true" />
      </UiButton>
    </Tooltip>
    <Tooltip :text="$t('actions.copy')">
      <UiButton
        test-id="copy"
        variant="help-ghost"
        size="icon-sm"
        :disabled="maxCharacters"
        :aria-label="$t('actions.copy')"
        @click="copyRow"
      >
        <Icon name="tabler:copy" :aria-hidden="true" />
      </UiButton>
    </Tooltip>
    <Tooltip :text="$t('actions.delete')">
      <UiButton
        test-id="delete"
        variant="destructive-ghost"
        size="icon-sm"
        :aria-label="$t('actions.delete')"
        @click="deleteRow"
      >
        <Icon name="tabler:trash" :aria-hidden="true" />
      </UiButton>
    </Tooltip>
    <UiDialog v-model:open="isEditing">
      <UiDialogContent
        test-id="edit-dialog"
        class="inset-0 translate-x-0 translate-y-0 max-h-dvh gap-0 border-0 rounded-none!"
      >
        <UiDialogHeader>
          <UiDialogTitle>
            {{ $t('actions.editItem', { item: item.name }) }}
          </UiDialogTitle>
          <UiDialogDescription class="sr-only" />
        </UiDialogHeader>
        <UiDialogBody>
          <FormHomebrew
            :campaign-id="sheet?.campaign?.id"
            :row="item"
            :sheet="sheet"
            :update="update"
            is-encounter
            @close="isEditing = false"
          />
        </UiDialogBody>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
