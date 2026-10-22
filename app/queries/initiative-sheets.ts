import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { diffRow } from '~~/shared/utils/dnd/combat-events'
import { optimisticCombatEvents } from '~/queries/combat-events'
import { toast } from 'vue-sonner'

export function useInitiativeSheetDetail(id: number) {
  const supabase = useSupabaseClient<DB>()

  return useQuery({
    queryKey: queryKeys.initiativeSheetDetail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('initiative_sheets')
        .select(
          `
        *, 
        campaign(
          id,
          title,
          createdBy(id, username, avatar, subscriptionType), 
          team(
            id,
            role, 
            user(id, username, avatar)
          )
        )
      `,
        )
        .eq('id', id)
        .single()

      if (error) throw createError(error)
      else return data as InitiativeSheet
    },
  })
}

export function useInitiativeSheetDetailUpdate() {
  const supabase = useSupabaseClient<DB>()
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { mutateAsync: sync } = useInitiativeSheetSync()

  return useCallbackMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: Omit<InitiativeUpdate, NotUpdatable | 'campaign'>
      id: number
    } & QueryDefaults) => {
      if (data.rows?.length) {
        data.rows = indexCorrect(data.rows).map(row => ({
          ...sanitizeRowNumbers(row),
          conditions: row.conditions.map(sanitizeCondition),
        }))
      }

      const { error } = await supabase
        .from('initiative_sheets')
        .update(data)
        .eq('id', id)

      if (error) throw createError(error)
    },
    onMutate: async ({ data, id }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.initiativeSheetDetail(id),
      })

      const previous = queryClient.getQueryData<InitiativeSheet>(
        queryKeys.initiativeSheetDetail(id),
      )

      queryClient.setQueryData(
        queryKeys.initiativeSheetDetail(id),
        (old: InitiativeSheet) => {
          if (!old) return old

          return { ...old, ...data, rows: data.rows || old.rows }
        },
      )

      return { previous }
    },
    onSuccess: (_data, { id, data }) => {
      sync({ id, live: touchesLiveView(data) }).catch(() => {})
    },
    onError: (error, { id, data }, context) => {
      if (context?.previous) {
        // roll back the optimistic update
        queryClient.setQueryData(
          queryKeys.initiativeSheetDetail(id),
          context.previous,
        )
      }

      toast.error(
        t(
          `pages.encounter.toasts.updateFailed.${failedFieldKey(data, UPDATE_FAILED_FIELDS, 'generic')}`,
        ),
        { description: t(`general.error.reasons.${getFailureReason(error)}`) },
      )
    },
  })
}

const liveViewFields = new Set(['round', 'activeIndex', 'rows', 'settings'])

function touchesLiveView(data: object): boolean {
  return Object.keys(data).some(key => liveViewFields.has(key))
}

export function useInitiativeSheetSync() {
  return useMutation({
    mutationFn: async ({ id, live }: { id: number; live: boolean }) => {
      await $fetch(`/api/encounter/${id}/sync`, {
        method: 'POST',
        body: { live },
      })
    },
  })
}

export function useInitiativeSheetTurn() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: ({ id }: { id: number } & QueryDefaults) =>
      $fetch<TurnResult>(`/api/encounter/${id}/turn`, { method: 'POST' }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.initiativeSheetDetail(id),
      })

      const previous = queryClient.getQueryData<InitiativeSheet>(
        queryKeys.initiativeSheetDetail(id),
      )

      if (previous) {
        const { activeIndex, round, rows } = advanceTurn(previous)

        queryClient.setQueryData(queryKeys.initiativeSheetDetail(id), {
          ...previous,
          activeIndex,
          round,
          rows,
        })
      }

      return { previous }
    },
    onSuccess: ({ sheet }, { id }) => {
      queryClient.setQueryData(
        queryKeys.initiativeSheetDetail(id),
        (old: InitiativeSheet | undefined) =>
          old && {
            ...old,
            activeIndex: sheet.activeIndex,
            round: sheet.round,
            rows: sheet.rows,
          },
      )

      void queryClient.invalidateQueries({
        queryKey: queryKeys.combatEvents(id),
      })
    },
    onError: (error, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.initiativeSheetDetail(id),
          context.previous,
        )
      }

      toast.error(t('pages.encounter.toasts.updateFailed.turn'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}

const PATCH_FAILED_FIELDS = [
  ['conditions', ['conditions']],
  [
    'hitPoints',
    ['hitPoints', 'maxHitPoints', 'maxHitPointsOld', 'tempHitPoints'],
  ],
  [
    'armorClass',
    ['armorClass', 'maxArmorClass', 'maxArmorClassOld', 'tempArmorClass'],
  ],
  ['deathSaves', ['deathSaves']],
  ['concentration', ['concentration']],
  ['readied', ['readied']],
  ['hidden', ['hidden']],
] as const satisfies readonly (readonly [
  string,
  readonly (keyof InitiativeSheetRow)[],
])[]

const UPDATE_FAILED_FIELDS = [
  ['rows', ['rows']],
  ['turn', ['activeIndex', 'round']],
  ['settings', ['settings']],
  ['infoCards', ['infoCards']],
  ['info', ['info']],
] as const satisfies readonly (readonly [
  string,
  readonly (keyof InitiativeSheet)[],
])[]

function failedFieldKey(
  payload: object,
  groups: readonly (readonly [string, readonly string[]])[],
  fallback: string,
): string {
  const match = groups.find(([, fields]) =>
    fields.some(field => field in payload),
  )

  return match ? match[0] : fallback
}

export function useInitiativeSheetPatch() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationFn: async ({
      id,
      rowId,
      patch,
    }: {
      id: number
      rowId: string
      patch: Partial<InitiativeSheetRow>
    } & QueryDefaults) => {
      const { row } = await $fetch<{ row: InitiativeSheetRow }>(
        `/api/encounter/${id}/patch-row`,
        { method: 'POST', body: { rowId, patch } },
      )

      return row
    },
    onMutate: async ({ id, rowId, patch }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.initiativeSheetDetail(id),
      })

      const previous = queryClient.getQueryData<InitiativeSheet>(
        queryKeys.initiativeSheetDetail(id),
      )
      const before = previous?.rows.find(row => row.id === rowId)

      queryClient.setQueryData(
        queryKeys.initiativeSheetDetail(id),
        (old: InitiativeSheet) => {
          if (!old) return old

          return {
            ...old,
            rows: old.rows.map(row =>
              row.id === rowId ? { ...row, ...patch } : row,
            ),
          }
        },
      )

      let previousEvents: CombatEventRow[] | undefined

      if (before) {
        const drafts = diffRow(before, { ...before, ...patch })

        if (drafts.length) {
          previousEvents = queryClient.getQueryData<CombatEventRow[]>(
            queryKeys.combatEvents(id),
          )

          const optimisticEvents = optimisticCombatEvents(
            id,
            previous?.round ?? 1,
            drafts,
            rowId,
          )

          queryClient.setQueryData<CombatEventRow[]>(
            queryKeys.combatEvents(id),
            (old = []) => [...optimisticEvents, ...old],
          )
        }
      }

      return { previous, previousEvents }
    },
    onError: (error, { id, rowId, patch }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.initiativeSheetDetail(id),
          context.previous,
        )
      }

      if (context?.previousEvents !== undefined) {
        queryClient.setQueryData(
          queryKeys.combatEvents(id),
          context.previousEvents,
        )
      }

      const name = context?.previous?.rows.find(row => row.id === rowId)?.name

      toast.error(
        name
          ? t(
              `pages.encounter.toasts.patchFailed.${failedFieldKey(patch, PATCH_FAILED_FIELDS, 'row')}`,
              { name },
            )
          : t('pages.encounter.toasts.patchFailed.generic'),
        { description: t(`general.error.reasons.${getFailureReason(error)}`) },
      )
    },
  })
}
