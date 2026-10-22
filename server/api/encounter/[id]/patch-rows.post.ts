import { serverSupabaseServiceRole } from '#supabase/server'
import { diffRow } from '~~/shared/utils/dnd/combat-events'
import { rowPatchSchema } from '~~/shared/utils/dnd/schema'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const bodySchema = z.object({
  patches: z
    .array(
      z.object({
        rowId: z.string().min(1),
        patch: rowPatchSchema.omit({ hidden: true }),
      }),
    )
    .min(1)
    .max(50)
    .refine(
      patches =>
        new Set(patches.map(({ rowId }) => rowId)).size === patches.length,
      { message: 'Each row can only be patched once' },
    ),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { patches } = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: sheet, error: sheetError } = await supabase
    .from('initiative_sheets')
    .select('round, rows')
    .eq('id', id)
    .single()

  if (sheetError) throw createError(postgresErrorToH3Error(sheetError))

  const before = new Map(sheet.rows.map(row => [row.id, row]))

  if (patches.some(({ rowId }) => !before.has(rowId))) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const { data: after, error } = await supabase.rpc('apply_live_actions', {
    p_encounter: id,
    p_patches: Object.fromEntries(
      patches.map(({ rowId, patch }) => [rowId, patch]),
    ),
  })

  if (error) throw createError(postgresErrorToH3Error(error))

  const events = after.flatMap(row =>
    diffRow(before.get(row.id)!, row).map(draft => ({
      ...draft,
      rowId: draft.rowId ?? row.id,
    })),
  )

  await Promise.all([
    logCombatEvents(supabase, {
      encounterId: id,
      round: sheet.round,
      actorId: user.id,
      events,
    }),
    broadcastSheetSync(supabase, id),
    ...(patches.some(({ patch }) => touchesPlayerView(patch))
      ? [broadcastActiveLiveState(supabase, id)]
      : []),
  ])

  return { rows: after }
})
