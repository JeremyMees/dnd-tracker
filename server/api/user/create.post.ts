import {
  serverSupabaseClient,
  serverSupabaseServiceRole,
} from '#supabase/server'
import { FIVE_MINUTES } from '~~/constants/time'
import * as z from 'zod'

const bodySchema = z.object({
  email: z.email().min(5).max(50),
  password: z.string().min(6).max(50),
  name: z.string().min(3).max(30),
  username: z.string().min(5).max(50),
  marketing: z.boolean().default(false),
  avatar: z.string().min(1),
  avatarOptions: z.record(z.string(), z.union([z.string(), z.number()])),
})

export default defineEventHandler(async event => {
  await assertRateLimit(event, {
    key: 'user-create',
    limit: 5,
    windowMs: FIVE_MINUTES,
  })

  const { email, password, ...profile } = await readValidatedBody(
    event,
    bodySchema.parse,
  )

  const client = await serverSupabaseClient<DB>(event)
  const { data, error } = await client.auth.signUp({ email, password })

  if (error) {
    throw createError({
      statusCode: error.status ?? 400,
      statusMessage: error.message,
      data: { code: error.code },
    })
  }

  if (!data.user || data.user.identities?.length === 0) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Email already in use',
      data: { code: 'user_already_exists' },
    })
  }

  const supabase = serverSupabaseServiceRole<DB>(event)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, email, ...profile })

  if (profileError) {
    await supabase.auth.admin.deleteUser(data.user.id)

    throw createError(postgresErrorToH3Error(profileError))
  }

  return { id: data.user.id }
})
