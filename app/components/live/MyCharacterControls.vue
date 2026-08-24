<script setup lang="ts">
import { useConditionsListing } from '~/queries/open5e'

const props = defineProps<{
  row: PlayerRow
  active: boolean
  allow: LiveAllowActions
}>()

const { apply, pending, endTurn } = useLiveMyAction(
  computed(() => props.row.id),
)
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
  if (locked.value || !props.allow.conditions) return

  const exists = props.row.conditions.some(c => c.id === condition.id)
  const value = exists
    ? props.row.conditions.filter(c => c.id !== condition.id)
    : [...props.row.conditions, condition]

  await apply({ type: 'conditions', value }, { conditions: value })
}
</script>

<template>
  <div test-id="my-character" class="flex flex-col gap-4">
    <UiButton
      test-id="end-turn"
      :disabled="locked || !allow.endTurn"
      class="w-full"
      @click="endTurn"
    >
      {{ $t('general.endTurn') }}
      <Icon name="tabler:chevron-right" aria-hidden="true" />
    </UiButton>

    <UiSeparator class="bg-muted" />
    <LiveMyCharacterHp
      v-if="isDefined(row.hitPoints)"
      :row="row"
      :pending="locked || !allow.hp"
      :apply="apply"
    />

    <UiSeparator class="bg-muted" />

    <LiveMyCharacterAc
      v-if="isDefined(row.armorClass)"
      :row="row"
      :pending="locked || !allow.ac"
      :apply="apply"
    />

    <div
      v-if="row.deathSaves"
      test-id="death-saves"
      class="flex flex-col gap-2"
    >
      <span class="text-xs font-bold text-muted-foreground">
        {{ $t('general.deathSaves') }}
      </span>
      <LiveDeathSaves
        :saves="row.deathSaves"
        :disabled="locked || !allow.deathSaves"
        @toggle="toggleDeathSave"
      />
    </div>

    <UiSeparator class="bg-muted" />

    <button
      test-id="concentration"
      type="button"
      :disabled="locked || !allow.concentration"
      :data-active="row.concentration"
      class="w-fit"
      @click="toggleConcentration"
    >
      <LiveStatConcentration :active="row.concentration" label />
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
              ? 'destructive'
              : 'outline'
          "
          class="cursor-pointer"
          :class="{
            'opacity-50 pointer-events-none':
              locked || conditionsPending || !allow.conditions,
          }"
          @click="toggleCondition(condition)"
        >
          {{ condition.name }}
        </UiBadge>
      </div>
    </div>
  </div>
</template>
