import { serverSupabaseServiceRole } from '#supabase/server'
import { rowPatchSchema } from '~~/shared/utils/dnd/schema'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const bodySchema = z.object({
  patches: z
    .array(
      z.object({
        rowId: z.string().min(1),
        patch: rowPatchSchema,
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

  const changes = sheetChangeContext(serverSupabaseServiceRole<DB>(event), id, {
    id: user.id,
  })
  const rows = await applyRowPatches(changes, patches)

  return { rows }
})
