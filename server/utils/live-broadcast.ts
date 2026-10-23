import type { serverSupabaseServiceRole } from '#supabase/server'
import { bloodiedConditionId } from '~~/constants/dnd'
import { conditionSchema, deathSavesSchema } from '~~/shared/utils/dnd/schema'
import { z } from 'zod'

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
  return applyHpChange(row, liveHpChange(action.hpType, action.amount), {
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
