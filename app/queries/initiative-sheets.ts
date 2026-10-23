import { useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { diffRow, diffSheet } from '~~/shared/utils/dnd/combat-events'
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

const SHEET_EDIT_KEY = ['initiativeSheetEdit']

type PendingSheetEdit = { id: number } & (
  | { data: UpdateInitiativeSheetData }
  | { rowId: string; patch: Partial<InitiativeSheetRow> }
  | { patches: RowPatch[] }
)

function withRowPatches(
  sheet: InitiativeSheet,
  patches: RowPatch[],
): InitiativeSheet {
  const byRow = new Map(patches.map(({ rowId, patch }) => [rowId, patch]))

  return {
    ...sheet,
    rows: sheet.rows.map(row => {
      const patch = byRow.get(row.id)

      return patch ? { ...row, ...patch } : row
    }),
  }
}

function withPendingEdit(
  sheet: InitiativeSheet,
  edit: PendingSheetEdit,
): InitiativeSheet {
  if ('data' in edit) {
    return { ...sheet, ...edit.data, rows: edit.data.rows || sheet.rows }
  }

  if ('patches' in edit) return withRowPatches(sheet, edit.patches)

  return withRowPatches(sheet, [{ rowId: edit.rowId, patch: edit.patch }])
}

export function withPendingEdits(
  queryClient: QueryClient,
  id: number,
  sheet: InitiativeSheet,
): InitiativeSheet {
  return queryClient
    .getMutationCache()
    .findAll({ mutationKey: SHEET_EDIT_KEY, status: 'pending' })
    .map(mutation => mutation.state.variables as PendingSheetEdit)
    .filter(edit => edit.id === id)
    .reduce(withPendingEdit, sheet)
}

export function useInitiativeSheetDetailUpdate() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationKey: SHEET_EDIT_KEY,
    mutationFn: async ({
      data,
      id,
    }: { data: UpdateInitiativeSheetData; id: number } & QueryDefaults) => {
      await $fetch(`/api/encounter/${id}`, { method: 'PATCH', body: data })
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
        (old: InitiativeSheet) => old && withPendingEdit(old, { id, data }),
      )

      const drafts = previous ? diffSheet(previous, data) : []

      if (!drafts.length) return { previous }

      const previousEvents = queryClient.getQueryData<CombatEventRow[]>(
        queryKeys.combatEvents(id),
      )

      queryClient.setQueryData<CombatEventRow[]>(
        queryKeys.combatEvents(id),
        (old = []) => [
          ...optimisticCombatEvents(
            id,
            data.round ?? previous?.round ?? 1,
            drafts,
          ),
          ...old,
        ],
      )

      return { previous, previousEvents }
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.combatEvents(id),
      })
    },
    onError: (error, { id, data }, context) => {
      rollbackPatchedRows(queryClient, id, context)

      toast.error(
        t(
          `pages.encounter.toasts.updateFailed.${failedFieldKey(data, UPDATE_FAILED_FIELDS, 'generic')}`,
        ),
        { description: t(`general.error.reasons.${getFailureReason(error)}`) },
      )
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

interface PatchedRowsContext {
  previous?: InitiativeSheet
  previousEvents?: CombatEventRow[]
}

async function patchRowsOptimistically(
  queryClient: QueryClient,
  id: number,
  patches: RowPatch[],
): Promise<PatchedRowsContext> {
  await queryClient.cancelQueries({
    queryKey: queryKeys.initiativeSheetDetail(id),
  })

  const previous = queryClient.getQueryData<InitiativeSheet>(
    queryKeys.initiativeSheetDetail(id),
  )
  const byRow = new Map(patches.map(({ rowId, patch }) => [rowId, patch]))

  queryClient.setQueryData(
    queryKeys.initiativeSheetDetail(id),
    (old: InitiativeSheet) => old && withRowPatches(old, patches),
  )

  const drafts = (previous?.rows ?? []).flatMap(row => {
    const patch = byRow.get(row.id)

    if (!patch) return []

    return diffRow(row, { ...row, ...patch }).map(draft => ({
      ...draft,
      rowId: draft.rowId ?? row.id,
    }))
  })

  if (!drafts.length) return { previous }

  const previousEvents = queryClient.getQueryData<CombatEventRow[]>(
    queryKeys.combatEvents(id),
  )

  queryClient.setQueryData<CombatEventRow[]>(
    queryKeys.combatEvents(id),
    (old = []) => [
      ...optimisticCombatEvents(id, previous?.round ?? 1, drafts),
      ...old,
    ],
  )

  return { previous, previousEvents }
}

function rollbackPatchedRows(
  queryClient: QueryClient,
  id: number,
  context?: PatchedRowsContext,
): void {
  if (context?.previous) {
    queryClient.setQueryData(
      queryKeys.initiativeSheetDetail(id),
      context.previous,
    )
  }

  if (context?.previousEvents !== undefined) {
    queryClient.setQueryData(queryKeys.combatEvents(id), context.previousEvents)
  }
}

export function useInitiativeSheetPatch() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationKey: SHEET_EDIT_KEY,
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
    onMutate: ({ id, rowId, patch }) =>
      patchRowsOptimistically(queryClient, id, [{ rowId, patch }]),
    onError: (error, { id, rowId, patch }, context) => {
      rollbackPatchedRows(queryClient, id, context)

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

export function useInitiativeSheetPatchRows() {
  const queryClient = useQueryClient()
  const { t } = useI18n()

  return useCallbackMutation({
    mutationKey: SHEET_EDIT_KEY,
    mutationFn: async ({
      id,
      patches,
    }: { id: number; patches: RowPatch[] } & QueryDefaults) => {
      const { rows } = await $fetch<{ rows: InitiativeSheetRow[] }>(
        `/api/encounter/${id}/patch-rows`,
        { method: 'POST', body: { patches } },
      )

      return rows
    },
    onMutate: ({ id, patches }) =>
      patchRowsOptimistically(queryClient, id, patches),
    onError: (error, { id }, context) => {
      rollbackPatchedRows(queryClient, id, context)

      toast.error(t('pages.encounter.toasts.patchFailed.generic'), {
        description: t(`general.error.reasons.${getFailureReason(error)}`),
      })
    },
  })
}
