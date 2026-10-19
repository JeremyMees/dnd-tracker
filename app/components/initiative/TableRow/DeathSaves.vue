<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { toast } from 'vue-sonner'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { patchRow } = validateInject(INITIATIVE_SHEET)

const { t } = useI18n()

function updateDeathSaves(
  deathSaves: DndDeathSaves,
  type: 'save' | 'fail',
): void {
  const { failed, saved } = checkDeathSaves(deathSaves)

  if (
    (saved && !failed && type === 'save') ||
    (!saved && failed && type === 'fail')
  ) {
    const toastType = saved ? 'stable' : 'died'

    const show = toastType === 'stable' ? toast.success : toast.error

    show(
      t(`components.initiativeTable.${toastType}.title`, {
        name: props.item.name,
      }),
      {
        description: t(
          `components.initiativeTable.${toastType}.textDeathSaves`,
          {
            name: props.item.name,
          },
        ),
      },
    )
  }

  patchRow(props.item.id, { deathSaves })
}
</script>

<template>
  <DeathSavePips
    v-if="hasDeathSaves(item.type)"
    test-id="container"
    class="mx-auto"
    :saves="item.deathSaves ?? resetDeathSaves()"
    @update:saves="updateDeathSaves"
  />
</template>
