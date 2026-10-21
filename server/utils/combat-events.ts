import type { serverSupabaseServiceRole } from '#supabase/server'

interface LogCombatEventsParams {
  encounterId: number
  rowId?: string
  round: number
  actorId?: string | null
  actorName?: string | null
  events: CombatEventDraft[]
}

export async function logCombatEvents(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  params: LogCombatEventsParams,
): Promise<void> {
  if (!params.events.length) return

  const { error } = await supabase.from('combat_events').insert(
    params.events.map(event => ({
      encounterId: params.encounterId,
      rowId: event.rowId ?? params.rowId ?? null,
      round: params.round,
      type: event.type,
      payload: event.payload,
      createdBy: params.actorId ?? null,
      actorName: params.actorName ?? null,
    })),
  )

  if (error) throw createError(postgresErrorToH3Error(error))
}

async function incrementSheetVersion(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<number> {
  const { data: version, error } = await supabase.rpc(
    'increment_sheet_version',
    { p_encounter: encounterId },
  )

  if (error) throw createError(postgresErrorToH3Error(error))

  return version
}

export async function broadcastSheetAction(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  action: Omit<SheetActionEvent, 'version'>,
): Promise<void> {
  const version = await incrementSheetVersion(supabase, encounterId)
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('action', { version, ...action })
}

export async function broadcastSheetSync(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  sheet: SheetSyncEvent['sheet'],
  reminders?: TurnReminders,
): Promise<void> {
  const version = await incrementSheetVersion(supabase, encounterId)
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('sync', {
    version,
    sheet,
    ...(reminders && { reminders }),
  })
}

export async function broadcastSheetEvents(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('events', {})
}

export async function broadcastSheetDeleted(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('deleted', {})
}
