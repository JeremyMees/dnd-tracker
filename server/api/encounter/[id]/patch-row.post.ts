import { serverSupabaseServiceRole } from '#supabase/server'
import { diffRow } from '~~/shared/utils/dnd/combat-events'
import {
  conditionSchema,
  deathSavesSchema,
  resourceUsesSchema,
} from '~~/shared/utils/dnd/schema'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const bodySchema = z.object({
  rowId: z.string().min(1),
  patch: z
    .object({
      hitPoints: z.number().int().optional(),
      maxHitPoints: z.number().int().optional(),
      maxHitPointsOld: z.number().int().optional(),
      tempHitPoints: z.number().int().optional(),
      armorClass: z.number().int().optional(),
      maxArmorClass: z.number().int().optional(),
      maxArmorClassOld: z.number().int().optional(),
      tempArmorClass: z.number().int().optional(),
      conditions: z.array(conditionSchema).optional(),
      deathSaves: deathSavesSchema.optional(),
      concentration: z.boolean().optional(),
      readied: z.boolean().optional(),
      hidden: z.boolean().optional(),
      resources: resourceUsesSchema.optional(),
    })
    .strict(),
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: sheet, error: sheetError } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', id)
    .single()

  if (sheetError) throw createError(postgresErrorToH3Error(sheetError))

  const before = sheet.rows.find(row => row.id === body.rowId)

  if (!before) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  if (body.patch.hidden && (await isLiveRowClaimed(supabase, id, body.rowId))) {
    throw createError({ statusCode: 409, statusMessage: 'row-claimed' })
  }

  const { data: after, error } = await supabase.rpc('apply_live_action', {
    p_encounter: id,
    p_row_id: body.rowId,
    p_patch: body.patch,
  })

  if (error) throw createError(postgresErrorToH3Error(error))

  await logCombatEvents(supabase, {
    encounterId: id,
    rowId: body.rowId,
    round: sheet.round,
    actorId: user.id,
    events: diffRow(before, after),
  })

  await broadcastSheetAction(supabase, id, {
    row: body.rowId,
    patch: body.patch,
  })

  const session = await activeLiveSession(supabase, id)

  if (session) {
    await broadcastLiveState(
      supabase,
      session,
      toPlayerSheet({
        ...sheet,
        rows: sheet.rows.map(row => (row.id === body.rowId ? after : row)),
      }),
    )
  }

  return { row: after }
})
