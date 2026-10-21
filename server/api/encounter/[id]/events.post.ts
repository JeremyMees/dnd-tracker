import { serverSupabaseServiceRole } from '#supabase/server'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const rowId = z.string().min(1).max(100)
const rowName = z.string().min(1).max(100)

const eventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('turn'),
    rowId,
    payload: z.object({ rowName }).strict(),
  }),
  z.object({
    type: z.literal('row_added'),
    rowId,
    payload: z
      .object({ rowName, initiative: z.number().int().optional() })
      .strict(),
  }),
  z.object({
    type: z.literal('row_removed'),
    rowId,
    payload: z.object({ rowName }).strict(),
  }),
  z.object({
    type: z.literal('roll'),
    rowId: rowId.nullable(),
    payload: z
      .object({
        rowName: rowName.optional(),
        kind: z.enum(['attack', 'dice']),
        result: z.enum(['hit', 'critical', 'miss']).optional(),
        total: z.number().int(),
        damage: z.number().int().optional(),
        dice: z.string().max(200).optional(),
      })
      .strict(),
  }),
])

const bodySchema = z.object({ events: z.array(eventSchema).min(1).max(50) })

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: sheet, error } = await supabase
    .from('initiative_sheets')
    .select('round')
    .eq('id', id)
    .single()

  if (error) throw createError(postgresErrorToH3Error(error))

  await logCombatEvents(supabase, {
    encounterId: id,
    round: sheet.round,
    actorId: user.id,
    events: body.events,
  })

  await broadcastSheetEvents(supabase, id)

  return { logged: body.events.length }
})
