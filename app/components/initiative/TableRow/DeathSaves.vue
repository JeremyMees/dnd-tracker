<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps<{ item: InitiativeSheetRow }>()

const { sheet, update } = validateInject(INITIATIVE_SHEET)

const { toast } = useToast()
const { t } = useI18n()

const { checkDeathSaves } = deathSavesFunctions

function updateDeathSave(saveIndex: number, save: boolean): void {
  if (!sheet.value) return

  const index = getCurrentRowIndex(sheet.value, props.item.id)
  const rows = [...sheet.value.rows]

  if (index === -1 || !rows[index] || !props.item.deathSaves) return

  const deathSaves = {
    save: [...props.item.deathSaves.save] as [boolean, boolean, boolean],
    fail: [...props.item.deathSaves.fail] as [boolean, boolean, boolean],
  }

  if (save) deathSaves.save[saveIndex] = !deathSaves.save[saveIndex]
  else deathSaves.fail[saveIndex] = !deathSaves.fail[saveIndex]

  rows[index] = {
    ...rows[index],
    deathSaves: {
      save: deathSaves.save,
      fail: deathSaves.fail,
    },
  }

  const { failed, saved } = checkDeathSaves(deathSaves)

  if ((saved && !failed && save) || (!saved && failed && !save)) {
    const toastType = saved ? 'stable' : 'died'

    toast({
      title: t(`components.initiativeTable.${toastType}.title`, { name: props.item.name }),
      description: t(`components.initiativeTable.${toastType}.textDeathSaves`, { name: props.item.name }),
      variant: toastType === 'stable' ? 'success' : 'destructive',
    })
  }

  update({ rows })
}
</script>

<template>
  <div
    v-if="item.type !== 'lair' && item.type !== 'summon'"
    data-test-container
    class="grid gap-1 w-fit mx-auto"
    :class="{
      'bg-success/20 p-2 rounded-lg': item.deathSaves?.save.every(Boolean) && !item.deathSaves?.fail.every(Boolean),
      'bg-destructive/20 p-2 rounded-lg': item.deathSaves?.fail.every(Boolean) && !item.deathSaves?.save.every(Boolean),
    }"
  >
    <div
      v-for="(save, i) in [item.deathSaves?.save, item.deathSaves?.fail]"
      :key="`save-${i}`"
      class="grid grid-cols-3 gap-1 min-w-14"
    >
      <button
        v-for="(value, j) in save"
        :key="`${value}-${j}`"
        :data-test-button="i === 0 ? 'save' : 'fail'"
        class="size-4 rounded border-2"
        :class="{
          'border-success bg-success/20': i === 0,
          'border-destructive bg-destructive/20': i === 1,
          '!bg-success': value && i === 0,
          '!bg-destructive': value && i === 1,
        }"
        @click="updateDeathSave(j, i === 0)"
      />
    </div>
  </div>
</template>
