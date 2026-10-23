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

export async function broadcastSheetEvents(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('events', {})
}

export async function broadcastSheetEventsCleared(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('events', { cleared: true })
}

export async function broadcastSheetDeleted(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('deleted', {})
}
