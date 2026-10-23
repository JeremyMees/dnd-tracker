import { serverSupabaseServiceRole } from '#supabase/server'
import { rowPatchSchema } from '~~/shared/utils/dnd/schema'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const bodySchema = z.object({
  rowId: z.string().min(1),
  patch: rowPatchSchema,
})

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const changes = sheetChangeContext(serverSupabaseServiceRole<DB>(event), id, {
    id: user.id,
  })
  const [row] = await applyRowPatches(changes, [body])

  return { row }
})
