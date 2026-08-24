import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async event => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const authHeader = getRequestHeader(event, 'Authorization')
  const { trmnl } = useRuntimeConfig()

  if (authHeader !== `Bearer ${trmnl}`) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const tables: DatabaseTable[] = [
    'campaigns',
    'homebrew_items',
    'initiative_sheets',
    'live_sessions',
    'notes',
    'profiles',
    'team',
  ]
  const counts: Record<string, number> = {}

  try {
    await Promise.all(
      tables.map(async table => {
        const { count, error, data } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .order('id', { ascending: false })
          .limit(1)

        if (error) {
          console.error(`Error fetching count for ${table}:`, error)
          counts[table] = 0
        } else {
          counts[table] =
            data[0] && typeof data[0].id === 'number'
              ? data[0].id
              : (count ?? 0)
        }
      }),
    )

    const [liveSessions, proProfiles, sheets] = await Promise.all([
      supabase
        .from('live_sessions')
        .select('*', { count: 'exact', head: true })
        .is('endedAt', null)
        .gt('expiresAt', new Date().toISOString()),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscriptionType', 'pro'),
      supabase.from('initiative_sheets').select('rows'),
    ])

    if (liveSessions.error) {
      console.error('Error fetching currently live count:', liveSessions.error)
    }
    if (proProfiles.error) {
      console.error('Error fetching pro subscriber count:', proProfiles.error)
    }
    if (sheets.error) {
      console.error('Error fetching combatants tracked:', sheets.error)
    }

    counts.currentlyLive = liveSessions.count ?? 0
    counts.proSubscribers = proProfiles.count ?? 0
    counts.combatantsTracked = (sheets.data ?? []).reduce(
      (total, sheet) =>
        total + (Array.isArray(sheet.rows) ? sheet.rows.length : 0),
      0,
    )

    return counts
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
})
