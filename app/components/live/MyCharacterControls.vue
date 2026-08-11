<script setup lang="ts">
import { useConditionsListing } from '~/queries/open5e'

const props = defineProps<{ row: PlayerRow; active: boolean }>()

const { apply, pending } = useLiveMyAction(computed(() => props.row.id))
const { data: conditionsList, isPending: conditionsPending } =
  useConditionsListing()

const locked = computed(() => pending.value || !props.active)

async function toggleDeathSave(index: number, isSave: boolean): Promise<void> {
  if (!props.row.deathSaves) return

  const save = [...props.row.deathSaves.save] as [boolean, boolean, boolean]
  const fail = [...props.row.deathSaves.fail] as [boolean, boolean, boolean]

  if (isSave) save[index] = !save[index]
  else fail[index] = !fail[index]

  const value = { save, fail }

  await apply({ type: 'deathSaves', value }, { deathSaves: value })
}

async function toggleConcentration(): Promise<void> {
  const value = !props.row.concentration

  await apply({ type: 'concentration', value }, { concentration: value })
}

async function toggleCondition(condition: DndCondition): Promise<void> {
  if (locked.value) return

  const exists = props.row.conditions.some(c => c.id === condition.id)
  const value = exists
    ? props.row.conditions.filter(c => c.id !== condition.id)
    : [...props.row.conditions, condition]

  await apply({ type: 'conditions', value }, { conditions: value })
}
</script>

<template>
  <div test-id="my-character" class="flex flex-col gap-4">
    <UiSeparator class="bg-muted" />

    <LiveMyCharacterHp
      v-if="isDefined(row.hitPoints)"
      :row="row"
      :pending="locked"
      :apply="apply"
    />

    <LiveMyCharacterAc
      v-if="isDefined(row.armorClass)"
      :row="row"
      :pending="locked"
      :apply="apply"
    />

    <div
      v-if="row.deathSaves"
      test-id="death-saves"
      class="flex flex-col gap-2"
    >
      <span class="text-xs font-bold text-muted-foreground">
        {{ $t('pages.live.deathSaves') }}
      </span>
      <div
        class="grid gap-1 w-fit"
        :class="{
          'bg-success/20 p-2 rounded-lg':
            row.deathSaves.save.every(Boolean) &&
            !row.deathSaves.fail.every(Boolean),
          'bg-destructive/20 p-2 rounded-lg':
            row.deathSaves.fail.every(Boolean) &&
            !row.deathSaves.save.every(Boolean),
        }"
      >
        <div
          v-for="(save, i) in [row.deathSaves.save, row.deathSaves.fail]"
          :key="`save-${i}`"
          class="grid grid-cols-3 gap-1 min-w-14"
        >
          <button
            v-for="(value, j) in save"
            :key="`${value}-${j}`"
            :test-id="i === 0 ? 'save' : 'fail'"
            :disabled="locked"
            class="size-4 rounded border-2"
            :class="{
              'border-success bg-success/20': i === 0,
              'border-destructive bg-destructive/20': i === 1,
              'bg-success!': value && i === 0,
              'bg-destructive!': value && i === 1,
            }"
            @click="toggleDeathSave(j, i === 0)"
          />
        </div>
      </div>
    </div>

    <button
      test-id="concentration"
      type="button"
      :disabled="locked"
      :data-active="row.concentration"
      class="flex items-center gap-1 w-fit text-muted-foreground"
      @click="toggleConcentration"
    >
      <Icon
        :name="
          row.concentration ? 'tabler:circle-filled' : 'tabler:circle-dotted'
        "
        class="size-4 min-w-4"
        aria-hidden="true"
      />
      <span class="text-xs">{{ $t('general.concentration') }}</span>
    </button>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-bold text-muted-foreground">
        {{ $t('pages.encounter.update.conditions') }}
      </span>
      <div class="flex flex-wrap gap-2">
        <UiBadge
          v-for="condition in conditionsList"
          :key="condition.name"
          test-id="condition"
          :variant="
            row.conditions.map(c => c.id).includes(condition.id)
              ? 'default'
              : 'outline'
          "
          class="cursor-pointer"
          :class="{
            'opacity-50 pointer-events-none': locked || conditionsPending,
          }"
          @click="toggleCondition(condition)"
        >
          {{ condition.name }}
        </UiBadge>
      </div>
    </div>
  </div>
</template>
