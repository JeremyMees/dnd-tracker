import { useQueryClient } from '@tanstack/vue-query'
import { liveStateQueryKey } from '~/queries/live'
import { useToast } from '~/components/ui/toast'

function toOwnPlayerRow(row: InitiativeSheetRow): PlayerRow {
  return {
    id: row.id,
    index: row.index,
    initiative: row.initiative,
    name: row.name,
    type: row.type,
    conditions: row.conditions,
    deathSaves: row.deathSaves,
    concentration: row.concentration,
    armorClass: row.armorClass,
    tempArmorClass: row.tempArmorClass,
    player: row.player,
    hitPoints: row.hitPoints,
    maxHitPoints: row.maxHitPoints,
    tempHitPoints: row.tempHitPoints,
  }
}

const LIVE_ACTION_ERRORS: Record<string, string> = {
  'Not your turn': 'notYourTurn',
  'Action not allowed': 'actionNotAllowed',
  'Live session has ended': 'sessionEnded',
  'Live session not found': 'sessionNotFound',
  'No row claimed': 'noRowClaimed',
  'Spectators cannot act': 'spectator',
  'Invalid live session token': 'seatExpired',
}

function failureDescriptionKey(error: unknown): string {
  const known = LIVE_ACTION_ERRORS[getErrorMessage(error) ?? '']

  return known
    ? `pages.live.actionErrors.${known}`
    : `general.error.reasons.${getFailureReason(error)}`
}

export function useLiveMyAction(rowId: ComputedRef<string | undefined>) {
  const { seat } = useLiveSeat()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const pending = ref(false)

  function notifyFailure(type: LiveAction['type'], error: unknown): void {
    toast({
      title: t(`pages.live.actionFailed.${type}`),
      description: t(failureDescriptionKey(error)),
      variant: 'destructive',
    })
  }

  async function apply(
    action: LiveRowAction,
    optimisticPatch: Partial<PlayerRow>,
  ): Promise<boolean> {
    const token = seat.value?.sessionToken
    const seatToken = seat.value?.seatToken

    if (!token || !seatToken || !rowId.value) return false

    const key = liveStateQueryKey(token, seatToken)
    const previous = queryClient.getQueryData<LiveStateResponse>(key)

    if (previous) {
      queryClient.setQueryData<LiveStateResponse>(key, {
        ...previous,
        sheet: {
          ...previous.sheet,
          rows: previous.sheet.rows.map(row =>
            row.id === rowId.value ? { ...row, ...optimisticPatch } : row,
          ),
        },
      })
    }

    pending.value = true

    try {
      const { row } = await $fetch<{ row: InitiativeSheetRow }>(
        '/api/encounter/live/action',
        { method: 'POST', body: { seatToken, action } },
      )

      const current = queryClient.getQueryData<LiveStateResponse>(key)

      if (current) {
        queryClient.setQueryData<LiveStateResponse>(key, {
          ...current,
          sheet: {
            ...current.sheet,
            rows: current.sheet.rows.map(r =>
              r.id === rowId.value ? toOwnPlayerRow(row) : r,
            ),
          },
        })
      }

      return true
    } catch (error) {
      if (previous) queryClient.setQueryData(key, previous)

      notifyFailure(action.type, error)

      return false
    } finally {
      pending.value = false
    }
  }

  async function endTurn(): Promise<boolean> {
    const token = seat.value?.sessionToken
    const seatToken = seat.value?.seatToken

    if (!token || !seatToken) return false

    pending.value = true

    try {
      await $fetch('/api/encounter/live/action', {
        method: 'POST',
        body: { seatToken, action: { type: 'endTurn' } },
      })

      queryClient.invalidateQueries({
        queryKey: liveStateQueryKey(token, seatToken),
      })

      return true
    } catch (error) {
      notifyFailure('endTurn', error)

      return false
    } finally {
      pending.value = false
    }
  }

  return { apply, pending, endTurn }
}
