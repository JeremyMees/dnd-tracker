import { serverSupabaseServiceRole } from '#supabase/server'
import { getValidatedRouterParams } from 'h3'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.coerce.number().int().positive() })

const bodySchema = z
  .object({ live: z.boolean().default(false) })
  .default({ live: false })

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const { live } = await readValidatedBody(event, bodySchema.parse)

  await requireEncounterAccess(event, id, user.id)

  const changes = sheetChangeContext(serverSupabaseServiceRole<DB>(event), id, {
    id: user.id,
  })
  const session = live ? await changes.store.liveSession(id) : undefined

  await Promise.all([
    sendSheetSync(changes),
    ...(session ? [sendLiveState(changes, session.uuid)] : []),
  ])

  return { synced: true }
})
