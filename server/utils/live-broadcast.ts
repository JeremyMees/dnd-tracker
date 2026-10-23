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

export async function isLiveRowClaimed(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounter: number,
  row: string,
): Promise<boolean> {
  const { data: session } = await supabase
    .from('live_sessions')
    .select('seats')
    .eq('encounter', encounter)
    .is('endedAt', null)
    .gt('expiresAt', new Date().toISOString())
    .maybeSingle()

  return !!session?.seats.some(seat => seat.row === row)
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
  encounterId: number,
): Promise<void> {
  const version = await incrementLiveVersion(supabase, session)

  const { data: sheet, error } = await supabase
    .from('initiative_sheets')
    .select('id, title, round, activeIndex, rows, settings')
    .eq('id', encounterId)
    .single()

  if (error) throw createError(postgresErrorToH3Error(error))

  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('sync', { version, sheet: toPlayerSheet(sheet) })
}

export async function broadcastActiveLiveState(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  session?: string,
): Promise<void> {
  const liveSession =
    session ?? (await activeLiveSession(supabase, encounterId))

  if (liveSession) await broadcastLiveState(supabase, liveSession, encounterId)
}

export function sanitizeBroadcastPatch(
  row: InitiativeSheetRow,
  actionType: string,
  patch: Partial<InitiativeSheetRow>,
): Partial<PlayerRow> {
  if (actionType === 'reaction') return { reaction: patch.resources?.reaction }

  if (actionType === 'ready') {
    return {
      readied: patch.readied,
      ...(patch.resources && { reaction: patch.resources.reaction }),
    }
  }

  if (row.type !== 'player') return patch

  const conditions = patch.conditions && withoutBloodied(patch.conditions)

  if (actionType === 'hp') {
    return {
      healthBand: getHealthBand(row.hitPoints, row.maxHitPoints),
      concentration: patch.concentration,
      conditions,
    }
  }

  if (actionType === 'deathSaves') return {}

  if (actionType === 'conditions') return { conditions }

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

type LiveActionSettings = Pick<InitiativeSettings, 'negative' | 'bloodied'>

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
  z.object({ type: z.literal('reaction'), value: z.boolean() }),
  z.object({ type: z.literal('ready'), value: z.boolean() }),
  z.object({ type: z.literal('endTurn') }),
])

export async function buildHpPatch(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  row: InitiativeSheetRow,
  settings: LiveActionSettings | undefined,
  action: Extract<z.infer<typeof liveActionSchema>, { type: 'hp' }>,
): Promise<Partial<InitiativeSheetRow>> {
  const bloodied = isBloodiedEnabled(settings)
    ? await srdCondition(supabase, bloodiedConditionId)
    : undefined
  const change: DndHpChange =
    action.hpType === 'damage'
      ? { type: 'damage', rolls: [{ amount: action.amount }] }
      : { type: action.hpType, amount: action.amount }

  return applyHpChange(row, change, {
    negative: settings?.negative,
    bloodied,
  }).patch
}

export function buildAcPatch(
  row: InitiativeSheetRow,
  settings: LiveActionSettings | undefined,
  action: Extract<z.infer<typeof liveActionSchema>, { type: 'ac' }>,
): Partial<InitiativeSheetRow> {
  return applyAcChange(
    row,
    { type: action.acType, amount: action.amount },
    { negative: settings?.negative },
  )
}

export async function buildLiveActionPatch(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  row: InitiativeSheetRow,
  settings: LiveActionSettings | undefined,
  action: Exclude<z.infer<typeof liveActionSchema>, { type: 'endTurn' }>,
): Promise<Partial<InitiativeSheetRow>> {
  if (action.type === 'hp') return buildHpPatch(supabase, row, settings, action)

  if (action.type === 'ac') return buildAcPatch(row, settings, action)

  if (action.type === 'reaction') {
    return {
      resources: { ...row.resources, reaction: action.value || undefined },
    }
  }

  if (action.type === 'ready') {
    return action.value
      ? { readied: true }
      : { readied: false, resources: { ...row.resources, reaction: true } }
  }

  return { [action.type]: action.value }
}
