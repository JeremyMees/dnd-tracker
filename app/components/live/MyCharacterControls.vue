<script setup lang="ts">
import { useConditionsListing } from '~/queries/srd'

const props = defineProps<{
  row: PlayerRow
  rows: PlayerRow[]
  active: boolean
  allow: LiveAllowActions
}>()

const { apply, pending, endTurn } = useLiveMyAction(
  computed(() => props.row.id),
)
const { data: conditionsList, isPending: conditionsPending } =
  useConditionsListing()

const locked = computed(() => pending.value || !props.active)

async function updateDeathSaves(value: DndDeathSaves): Promise<void> {
  await apply({ type: 'deathSaves', value }, { deathSaves: value })
}

async function setConcentration(used: number): Promise<void> {
  const value = used > 0

  await apply({ type: 'concentration', value }, { concentration: value })
}

async function setReaction(used: number): Promise<void> {
  const value = used > 0

  await apply({ type: 'reaction', value }, { reaction: value || undefined })
}

async function applyConditions(value: DndCondition[]): Promise<void> {
  if (locked.value || !props.allow.conditions) return

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
      <DeathSavePips
        :saves="row.deathSaves"
        :disabled="locked || !allow.deathSaves"
        @update:saves="updateDeathSaves"
      />
    </div>

    <UiSeparator class="bg-muted" />

    <div class="flex flex-wrap gap-x-8 gap-y-4">
      <div test-id="concentration" class="flex flex-col gap-2">
        <span class="text-xs font-bold text-muted-foreground">
          {{ $t('general.concentration') }}
        </span>
        <UsePips
          :label="$t('general.concentration')"
          :max="1"
          :used="row.concentration ? 1 : 0"
          :disabled="locked || !allow.concentration"
          @update:used="setConcentration"
        />
      </div>

      <div
        v-if="row.type !== 'lair'"
        test-id="reaction"
        class="flex flex-col gap-2"
      >
        <span class="text-xs font-bold text-muted-foreground">
          {{ $t('general.reaction') }}
        </span>
        <UsePips
          :label="$t('general.reaction')"
          :max="1"
          :used="row.reaction ? 1 : 0"
          :disabled="pending || !allow.reaction"
          @update:used="setReaction"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-xs font-bold text-muted-foreground">
        {{ $t('pages.encounter.update.conditions') }}
      </span>
      <ConditionPicker
        :conditions="conditionsList ?? []"
        :applied="row.conditions"
        :item="row"
        :rows="rows"
        :active-row-id="row.id"
        :disabled="locked || conditionsPending || !allow.conditions"
        @add="applyConditions([...row.conditions, $event])"
        @remove="
          applyConditions(row.conditions.filter(c => c.id !== $event.id))
        "
      />
    </div>
  </div>
</template>
