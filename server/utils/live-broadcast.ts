import type { serverSupabaseServiceRole } from '#supabase/server'
import { bloodiedConditionId } from '~~/constants/dnd'
import { conditionSchema, deathSavesSchema } from '~~/shared/utils/dnd/schema'
import { z } from 'zod'

async function incrementLiveVersion(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
): Promise<number> {
  const { data: version, error } = await supabase.rpc(
    'increment_live_version',
    { p_session: session },
  )

  if (error) throw createError(postgresErrorToH3Error(error))

  return version
}

export async function activeLiveSession(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounter: number,
): Promise<string | undefined> {
  const { data: session } = await supabase
    .from('live_sessions')
    .select('uuid')
    .eq('encounter', encounter)
    .is('endedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  return session?.uuid
}

export async function broadcastLiveAction(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
  action: Omit<LiveActionEvent, 'version'>,
): Promise<void> {
  const version = await incrementLiveVersion(supabase, session)
  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('action', { version, ...action })
}

export async function broadcastLiveState(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
  sheet: LiveSyncEvent['sheet'],
): Promise<void> {
  const version = await incrementLiveVersion(supabase, session)
  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('sync', { version, sheet })
}

export function sanitizeBroadcastPatch(
  row: InitiativeSheetRow,
  actionType: string,
  patch: Partial<InitiativeSheetRow>,
): Partial<PlayerRow> {
  if (row.type !== 'player') return patch

  if (actionType === 'hp') {
    return {
      healthBand: getHealthBand(row.hitPoints, row.maxHitPoints),
      concentration: patch.concentration,
      conditions: patch.conditions,
    }
  }

  if (actionType === 'deathSaves') return {}

  return patch
}

export async function broadcastLiveEnded(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
): Promise<void> {
  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('ended', {})
}

export async function broadcastLiveSummary(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
  stats: CombatStats,
): Promise<void> {
  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('summary', { stats })
}

export async function broadcastLiveSeats(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
  update: LiveSeatsBroadcast,
): Promise<void> {
  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('seats', update)
}

export const liveActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hp'),
    hpType: z.enum(['heal', 'damage', 'temp']),
    amount: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('ac'),
    acType: z.enum(['add', 'remove', 'temp']),
    amount: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal('deathSaves'), value: deathSavesSchema }),
  z.object({ type: z.literal('concentration'), value: z.boolean() }),
  z.object({ type: z.literal('conditions'), value: z.array(conditionSchema) }),
  z.object({ type: z.literal('endTurn') }),
])

export async function buildHpPatch(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounter: number,
  rowId: string,
  action: Extract<z.infer<typeof liveActionSchema>, { type: 'hp' }>,
): Promise<Partial<InitiativeSheetRow>> {
  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('rows, settings')
    .eq('id', encounter)
    .single()

  const row = sheet?.rows.find(r => r.id === rowId)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const { row: updated } = handleHpChanges(
    action.amount,
    action.hpType,
    row,
    sheet?.settings.negative ?? false,
  )
  const bloodied = isBloodiedEnabled(sheet?.settings)
    ? await srdCondition(supabase, bloodiedConditionId)
    : undefined

  return {
    hitPoints: updated.hitPoints,
    tempHitPoints: updated.tempHitPoints,
    deathSaves: updated.deathSaves,
    concentration: updated.concentration,
    conditions: withBloodied(updated, bloodied).conditions,
  }
}

export async function buildAcPatch(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounter: number,
  rowId: string,
  action: Extract<z.infer<typeof liveActionSchema>, { type: 'ac' }>,
): Promise<Partial<InitiativeSheetRow>> {
  const { data: sheet } = await supabase
    .from('initiative_sheets')
    .select('rows, settings')
    .eq('id', encounter)
    .single()

  const row = sheet?.rows.find(r => r.id === rowId)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const updated = handleAcChanges(
    action.amount,
    action.acType,
    row,
    sheet?.settings?.negative ?? false,
  )

  return {
    armorClass: updated.armorClass,
    tempArmorClass: updated.tempArmorClass,
  }
}
