<script setup lang="ts">
const props = defineProps<{
  encounterId: number
  session: LiveSessionResponse | undefined
  rows: { id: string; name: string }[]
}>()

const { t } = useI18n()
const { ask } = useConfirm()
const { seats, connected, kick, reassign } = useLiveSeats(
  props.encounterId,
  toRef(props, 'session'),
)

function rowName(id: string | null): string {
  return props.rows.find(row => row.id === id)?.name ?? ''
}

function availableRows(seat: LiveSeat): { id: string; name: string }[] {
  return props.rows.filter(
    row => row.id === seat.row || !seats.value.some(s => s.row === row.id),
  )
}

function confirmKick(seat: LiveSeat): void {
  ask(
    {
      title: t('components.liveSession.seats.kickConfirm.title', {
        name: seat.name,
      }),
      description: t('components.liveSession.seats.kickConfirm.text'),
    },
    async confirmed => {
      if (confirmed) await kick(seat.seat)
    },
  )
}
</script>

<template>
  <div test-id="seat-list" class="flex flex-col gap-2 w-full text-left">
    <p class="text-xs text-muted-foreground uppercase tracking-wide">
      {{ $t('components.liveSession.seats.title') }}
    </p>

    <p
      v-if="!seats.length"
      test-id="seat-empty"
      class="text-sm text-muted-foreground"
    >
      {{ $t('components.liveSession.seats.empty') }}
    </p>

    <ul v-else class="flex flex-col gap-2 max-h-48 overflow-y-auto">
      <li
        v-for="seat in seats"
        :key="seat.seat"
        :test-id="`seat-${seat.seat}`"
        class="flex items-center gap-2 text-sm"
      >
        <span
          v-tippy="
            connected.has(seat.seat)
              ? $t('components.liveSession.seats.online')
              : $t('components.liveSession.seats.offline')
          "
          :test-id="`seat-status-${seat.seat}`"
          class="size-2 rounded-full shrink-0 animate-pulse"
          :class="
            connected.has(seat.seat) ? 'bg-success' : 'bg-muted-foreground/30'
          "
        />

        <div class="flex flex-col flex-1 min-w-0">
          <span class="font-medium truncate">{{ seat.name }}</span>
          <span class="text-xs text-muted-foreground truncate">
            {{
              seat.spectator
                ? $t('components.liveSession.seats.spectator')
                : $t('components.liveSession.seats.playing', {
                    row: rowName(seat.row),
                  })
            }}
          </span>
        </div>

        <UiSelect
          v-if="!seat.spectator"
          :model-value="seat.row ?? undefined"
          @update:model-value="value => reassign(seat.seat, value as string)"
        >
          <UiSelectTrigger
            :test-id="`reassign-${seat.seat}`"
            size="sm"
            class="w-auto"
          >
            <UiSelectValue
              :placeholder="
                $t('components.liveSession.seats.reassignPlaceholder')
              "
            />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem
              v-for="row in availableRows(seat)"
              :key="row.id"
              :value="row.id"
            >
              {{ row.name }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>

        <UiButton
          :test-id="`kick-${seat.seat}`"
          variant="destructive-ghost"
          size="icon-sm"
          :aria-label="$t('components.liveSession.seats.kick')"
          @click="confirmKick(seat)"
        >
          <Icon name="tabler:user-x" aria-hidden="true" />
        </UiButton>
      </li>
    </ul>
  </div>
</template>
