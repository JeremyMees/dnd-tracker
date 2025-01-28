<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps<{
  item: InitiativeSheetRow
  sheet: InitiativeSheet
  update: (payload: Omit<Partial<InitiativeSheet>, NotUpdatable>) => Promise<void>
}>()

const { toast } = useToast()
const { t } = useI18n()

function updateDeathSave(saveIndex: number, save: boolean): void {
  const index = getCurrentRowIndex(props.sheet, props.item.id)
  const rows = props.sheet.rows

  if (index === -1) return
  if (!props.item.deathSaves) return

  const deathSaves = props.item.deathSaves

  if (save) deathSaves.save[saveIndex] = !deathSaves.save[saveIndex]
  else deathSaves.fail[saveIndex] = !deathSaves.fail[saveIndex]

  rows[index].deathSaves = deathSaves

  checkForDeathSaveNotifications()

  props.update({ rows })
}

function checkForDeathSaveNotifications(): void {
  const { save, fail } = props.item.deathSaves!
  const savedFully = save.every(Boolean)
  const failedFully = fail.every(Boolean)

  if ((savedFully && failedFully) || (!savedFully && !failedFully)) return

  const type = t(`general.${props.item.type}`)
  const toastType = savedFully ? 'stable' : 'died'

  toast({
    title: t(`components.initiativeTable.${toastType}.title`, { type }),
    description: t(`components.initiativeTable.${toastType}.textDeathSaves`, { type }),
    variant: toastType === 'stable' ? 'success' : 'destructive',
  })
}
</script>

<template>
  <td>
    <div
      class="grid gap-1 w-fit mx-auto"
      :class="{
        'bg-success/20 p-2 rounded-lg': item.deathSaves?.save.every(Boolean) && !item.deathSaves?.fail.every(Boolean),
        'bg-destructive/20 p-2 rounded-lg': item.deathSaves?.fail.every(Boolean) && !item.deathSaves?.save.every(Boolean),
      }"
    >
      <div
        v-for="(save, i) in [item.deathSaves?.save, item.deathSaves?.fail]"
        :key="`save-${i}`"
        class="grid grid-cols-3 gap-1 w-14"
      >
        <button
          v-for="(value, j) in save"
          :key="`${value}-${j}`"
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
  </td>
</template>
