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

export function useLiveMyAction(rowId: ComputedRef<string | undefined>) {
  const { seat } = useLiveSeat()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useI18n()

  const pending = ref(false)

  async function apply(
    action: LiveAction,
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
        '/api/live/action',
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
    } catch {
      if (previous) queryClient.setQueryData(key, previous)

      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })

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
      await $fetch('/api/live/action', {
        method: 'POST',
        body: { seatToken, action: { type: 'endTurn' } },
      })

      queryClient.invalidateQueries({
        queryKey: liveStateQueryKey(token, seatToken),
      })

      return true
    } catch {
      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })

      return false
    } finally {
      pending.value = false
    }
  }

  return { apply, pending, endTurn }
}
