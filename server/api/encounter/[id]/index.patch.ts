import { serverSupabaseServiceRole } from '#supabase/server'
import { conditionSchema } from '~~/shared/utils/dnd/schema'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const rowSchema = z.looseObject({
  id: z.union([z.string().min(1).max(100), z.number().int()]),
  name: z.string().min(1).max(100),
  conditions: z.array(conditionSchema),
})

const bodySchema = z
  .object({
    rows: z.array(rowSchema).optional(),
    baseRows: z.array(rowSchema).optional(),
    activeIndex: z.number().int().min(0).optional(),
    round: z.number().int().min(0).optional(),
    settings: z.looseObject({}).optional(),
    info: z.string().nullable().optional(),
    infoCards: z
      .array(z.looseObject({ id: z.string(), name: z.string() }))
      .max(10)
      .optional(),
  })
  .strict()

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  await applySheetUpdate(
    sheetChangeContext(serverSupabaseServiceRole<DB>(event), id, {
      id: user.id,
    }),
    body as InitiativeSheetUpdate,
  )

  return { updated: true }
})
