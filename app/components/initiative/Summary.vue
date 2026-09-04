<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { aggregateCombatStats } from '~~/shared/utils/dnd/combat-stats'
import { useCombatEvents } from '~/queries/combat-events'

const props = defineProps<{
  encounterId: number
  rows: InitiativeSheetRow[] | undefined
  rounds: number
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  reset: [boolean]
  keepPlaying: []
}>()

const { toast } = useToast()
const { t } = useI18n()
const { active: liveActive } = useLiveSession(props.encounterId)

const sharing = shallowRef<boolean>(false)
const shared = shallowRef<boolean>(false)

const { data: events, isPending } = useCombatEvents(
  props.encounterId,
  () => props.open,
)

const stats = computed(() =>
  aggregateCombatStats(events.value ?? [], props.rows ?? [], props.rounds),
)

async function share(): Promise<void> {
  sharing.value = true

  try {
    await $fetch('/api/encounter/live/summary', {
      method: 'POST',
      body: { encounter: props.encounterId },
    })

    shared.value = true
  } catch {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  } finally {
    sharing.value = false
  }
}

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) shared.value = false
  },
)
</script>

<template>
  <UiDialog
    :open="open"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <UiDialogScrollContent test-id="summary" class="max-w-2xl">
      <UiDialogHeader>
        <UiDialogTitle>
          {{ $t('components.combatSummary.title') }}
        </UiDialogTitle>
        <UiDialogDescription>
          {{ $t('components.combatSummary.description') }}
        </UiDialogDescription>
      </UiDialogHeader>

      <div v-if="isPending" test-id="loading" class="flex flex-col gap-4">
        <UiSkeleton class="h-24 w-full rounded-lg" />
        <UiSkeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-lg" />
      </div>

      <p
        v-else-if="!events?.length"
        test-id="empty"
        class="text-sm text-muted-foreground"
      >
        {{ $t('components.combatSummary.empty') }}
      </p>

      <CombatSummaryStats v-else :stats="stats" />

      <UiDialogFooter class="flex-col sm:flex-row gap-2">
        <UiButton
          v-if="liveActive"
          test-id="share"
          variant="info"
          :disabled="sharing || shared || !events?.length"
          @click="share"
        >
          <Icon
            :name="shared ? 'tabler:check' : 'tabler:broadcast'"
            aria-hidden="true"
          />
          {{
            shared
              ? $t('components.combatSummary.actions.shared')
              : $t('components.combatSummary.actions.share')
          }}
        </UiButton>
        <UiButton
          test-id="reset"
          variant="destructive"
          @click="emit('reset', true)"
        >
          <Icon name="tabler:refresh" aria-hidden="true" />
          {{ $t('components.combatSummary.actions.reset') }}
        </UiButton>
        <UiButton test-id="keep-playing" @click="emit('keepPlaying')">
          <Icon name="tabler:player-play" aria-hidden="true" />
          {{ $t('components.combatSummary.actions.keepPlaying') }}
        </UiButton>
      </UiDialogFooter>
    </UiDialogScrollContent>
  </UiDialog>
</template>
