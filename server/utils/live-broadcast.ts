import type { serverSupabaseServiceRole } from '#supabase/server'
import { conditionSchema, deathSavesSchema } from '~~/shared/utils/dnd/schema'
import { z } from 'zod'

interface LiveActionBroadcast {
  row: string
  patch: Partial<InitiativeSheetRow>
}

export async function broadcastLiveAction(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  session: string,
  action: LiveActionBroadcast,
): Promise<void> {
  const { data: version, error } = await supabase.rpc(
    'increment_live_version',
    { p_session: session },
  )

  if (error) throw createError(postgresErrorToH3Error(error))

  const channel = supabase.channel(`live:${session}`)

  await channel.httpSend('action', { version, ...action })
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
  z.object({ type: z.literal('initiative'), value: z.number() }),
  z.object({ type: z.literal('deathSaves'), value: deathSavesSchema }),
  z.object({ type: z.literal('concentration'), value: z.boolean() }),
  z.object({ type: z.literal('conditions'), value: z.array(conditionSchema) }),
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

  return {
    hitPoints: updated.hitPoints,
    tempHitPoints: updated.tempHitPoints,
    deathSaves: updated.deathSaves,
    concentration: updated.concentration,
    conditions: updated.conditions,
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
    .select('rows')
    .eq('id', encounter)
    .single()

  const row = sheet?.rows.find(r => r.id === rowId)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Row not found' })
  }

  const updated = { ...row }

  acFunctions[action.acType](updated, action.amount)

  return {
    armorClass: updated.armorClass,
    tempArmorClass: updated.tempArmorClass,
  }
}
