import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from './env'

export function supabaseClient(): SupabaseClient<DB> {
  return createClient<DB>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_KEY'),
    { auth: { persistSession: false } },
  )
}

export async function emptyLocalDatabase(): Promise<void> {
  const url = requireEnv('SUPABASE_URL')
  const { hostname } = new URL(url)

  if (!['127.0.0.1', 'localhost'].includes(hostname)) {
    throw new Error(`Refusing to empty a non-local database: ${url}`)
  }

  const supabase = createClient(url, requireEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  })

  async function empty(table: DatabaseTable) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) throw error
  }

  await empty('initiative_sheets')
  await empty('campaigns')
  await empty('features')
}
