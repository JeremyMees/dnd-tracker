<script setup lang="ts">
import { useCombatEvents } from '~/queries/combat-events'

interface CombatEventPayload {
  rowName?: string
  kind?: string
  amount?: number
  before?: number
  after?: number
  condition?: { id: string; name: string }
  result?: 'save' | 'fail'
}

const props = defineProps<{ encounterId: number }>()

const { t } = useI18n()
const { data: events, isPending } = useCombatEvents(props.encounterId)

function describeEvent(event: CombatEventRow): string {
  const payload = (event.payload ?? {}) as CombatEventPayload
  const rowName = payload.rowName ?? ''

  switch (event.type as CombatEventType) {
    case 'hp':
      return t(`components.combatLog.hp.${payload.kind}`, {
        rowName,
        amount: payload.amount,
        after: payload.after,
      })
    case 'ac':
      return t(`components.combatLog.ac.${payload.kind}`, {
        rowName,
        amount: payload.amount,
        after: payload.after,
      })
    case 'condition_added':
      return t('components.combatLog.conditionAdded', {
        rowName,
        condition: payload.condition?.name,
      })
    case 'condition_removed':
      return t('components.combatLog.conditionRemoved', {
        rowName,
        condition: payload.condition?.name,
      })
    case 'concentration_broken':
      return t('components.combatLog.concentrationBroken', { rowName })
    case 'concentration_started':
      return t('components.combatLog.concentrationStarted', { rowName })
    case 'death_save':
      return t(
        `components.combatLog.deathSave.${payload.result}`,
        { rowName, amount: payload.amount },
        payload.amount ?? 1,
      )
    case 'stabilized':
      return t('components.combatLog.stabilized', { rowName })
    case 'died':
      return t('components.combatLog.died', { rowName })
    default:
      return rowName
  }
}

function eventIcon(type: CombatEventType): string {
  switch (type) {
    case 'hp':
      return 'tabler:heart'
    case 'ac':
      return 'tabler:shield'
    case 'condition_added':
      return 'tabler:bolt'
    case 'condition_removed':
      return 'tabler:bolt-off'
    case 'concentration_broken':
      return 'tabler:circle-dotted'
    case 'concentration_started':
      return 'tabler:circle-filled'
    case 'death_save':
      return 'tabler:skull'
    case 'stabilized':
      return 'tabler:heart-bolt'
    case 'died':
      return 'tabler:grave'
    default:
      return 'tabler:point'
  }
}
</script>

<template>
  <aside
    test-id="history-panel"
    class="w-full lg:w-[320px] shrink-0 overflow-y-auto p-6 border-t lg:border-t-0 lg:border-l border-border bg-background lg:sticky lg:top-4 lg:h-[calc(100vh-5rem)]"
  >
    <p
      class="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-6"
    >
      {{ $t('general.combatLog') }}
    </p>

    <div v-if="isPending" class="flex flex-col gap-3">
      <UiSkeleton
        v-for="i in 5"
        :key="i"
        test-id="loading"
        class="h-10 w-full rounded-lg"
      />
    </div>

    <p
      v-else-if="!events?.length"
      test-id="empty"
      class="text-sm text-muted-foreground"
    >
      {{ $t('components.combatLog.empty') }}
    </p>

    <ul v-else class="flex flex-col gap-4">
      <li
        v-for="event in events"
        :key="event.id"
        test-id="event"
        class="flex items-start gap-3"
      >
        <Icon
          :name="eventIcon(event.type as CombatEventType)"
          class="size-4 min-w-4 mt-0.5 text-muted-foreground"
          aria-hidden="true"
        />
        <div class="min-w-0">
          <p class="text-sm">{{ describeEvent(event) }}</p>
          <p class="text-xs text-muted-foreground">
            {{ $t('components.combatLog.round', { round: event.round }) }}
          </p>
        </div>
      </li>
    </ul>
  </aside>
</template>
