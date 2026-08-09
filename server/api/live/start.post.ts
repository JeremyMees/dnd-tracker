import { serverSupabaseServiceRole } from '#supabase/server'
import * as z from 'zod'

const bodySchema = z.object({
  encounter: z.number().int().positive(),
})

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000

export default defineEventHandler(async event => {
  const user = await requireUser(event)
  const body = await readValidatedBody(event, bodySchema.parse)
  const supabase = serverSupabaseServiceRole<DB>(event)

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscriptionType')
    .eq('id', user.id)
    .single()

  if (profile?.subscriptionType !== 'pro') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Live sessions require a pro subscription',
    })
  }

  const encounter = await requireEncounterAccess(event, body.encounter, user.id)

  const { data: existing } = await supabase
    .from('live_sessions')
    .select('uuid, code, expiresAt')
    .eq('encounter', encounter.id)
    .is('endedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  if (existing) {
    const token = await signLiveSessionToken(
      { session: existing.uuid, encounter: encounter.id },
      new Date(existing.expiresAt),
    )

    return { token, code: existing.code, expiresAt: existing.expiresAt }
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: session, error } = await supabase
      .from('live_sessions')
      .insert({
        encounter: encounter.id,
        createdBy: user.id,
        code: generateLiveCode(),
        expiresAt: expiresAt.toISOString(),
      })
      .select('uuid, code, expiresAt')
      .single()

    if (!error) {
      const token = await signLiveSessionToken(
        { session: session.uuid, encounter: encounter.id },
        expiresAt,
      )

      return { token, code: session.code, expiresAt: session.expiresAt }
    }

    if (error.code !== '23505') {
      throw createError(postgresErrorToH3Error(error))
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'Could not generate a unique room code',
  })
})
