import type { serverSupabaseServiceRole } from '#supabase/server'
import { checkDeathSaves } from '~~/shared/utils/dnd/death-saves'

export interface CombatEventDraft {
  type: CombatEventType
  payload: { [key: string]: Json | undefined }
}

function countNewlyTrue(before: boolean[], after: boolean[]): number {
  return after.filter((value, index) => value && !before[index]).length
}

export function diffRow(
  before: InitiativeSheetRow,
  after: InitiativeSheetRow,
): CombatEventDraft[] {
  const events: CombatEventDraft[] = []
  const rowName = after.name

  if (after.hitPoints !== before.hitPoints) {
    const delta = (after.hitPoints ?? 0) - (before.hitPoints ?? 0)
    const overridden = after.maxHitPoints !== before.maxHitPoints

    events.push({
      type: 'hp',
      payload: {
        rowName,
        kind: overridden ? 'override' : delta > 0 ? 'heal' : 'damage',
        amount: Math.abs(delta),
        before: before.hitPoints,
        after: after.hitPoints,
      },
    })
  } else if (after.tempHitPoints !== before.tempHitPoints) {
    events.push({
      type: 'hp',
      payload: {
        rowName,
        kind: 'temp',
        amount: after.tempHitPoints,
        before: before.tempHitPoints,
        after: after.tempHitPoints,
      },
    })
  }

  if (after.armorClass !== before.armorClass) {
    const delta = (after.armorClass ?? 0) - (before.armorClass ?? 0)
    const overridden = after.maxArmorClass !== before.maxArmorClass

    events.push({
      type: 'ac',
      payload: {
        rowName,
        kind: overridden ? 'override' : delta > 0 ? 'add' : 'remove',
        amount: Math.abs(delta),
        before: before.armorClass,
        after: after.armorClass,
      },
    })
  } else if (after.tempArmorClass !== before.tempArmorClass) {
    events.push({
      type: 'ac',
      payload: {
        rowName,
        kind: 'temp',
        amount: after.tempArmorClass,
        before: before.tempArmorClass,
        after: after.tempArmorClass,
      },
    })
  }

  const beforeConditionIds = new Set(before.conditions.map(c => c.id))
  const afterConditionIds = new Set(after.conditions.map(c => c.id))

  for (const condition of after.conditions) {
    if (!beforeConditionIds.has(condition.id)) {
      events.push({
        type: 'condition_added',
        payload: {
          rowName,
          condition: { id: condition.id, name: condition.name },
        },
      })
    }
  }

  for (const condition of before.conditions) {
    if (!afterConditionIds.has(condition.id)) {
      events.push({
        type: 'condition_removed',
        payload: {
          rowName,
          condition: { id: condition.id, name: condition.name },
        },
      })
    }
  }

  if (before.concentration === true && after.concentration === false) {
    events.push({ type: 'concentration_broken', payload: { rowName } })
  }

  if (before.deathSaves && after.deathSaves) {
    const addedFails = countNewlyTrue(
      before.deathSaves.fail,
      after.deathSaves.fail,
    )
    const addedSaves = countNewlyTrue(
      before.deathSaves.save,
      after.deathSaves.save,
    )

    if (addedFails > 0) {
      events.push({
        type: 'death_save',
        payload: { rowName, result: 'fail', amount: addedFails },
      })
    }

    if (addedSaves > 0) {
      events.push({
        type: 'death_save',
        payload: { rowName, result: 'save', amount: addedSaves },
      })
    }

    const beforeStatus = checkDeathSaves(before.deathSaves)
    const afterStatus = checkDeathSaves(after.deathSaves)

    if (afterStatus.saved && !afterStatus.failed && !beforeStatus.saved) {
      events.push({ type: 'stabilized', payload: { rowName } })
    }

    if (afterStatus.failed && !afterStatus.saved && !beforeStatus.failed) {
      events.push({ type: 'died', payload: { rowName } })
    }
  }

  return events
}

interface LogCombatEventsParams {
  encounterId: number
  rowId: string
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
      rowId: params.rowId,
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

interface SheetActionBroadcast {
  row: string
  patch: Partial<InitiativeSheetRow>
}

export async function broadcastSheetAction(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  action: SheetActionBroadcast,
): Promise<void> {
  const version = await incrementSheetVersion(supabase, encounterId)
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('action', { version, ...action })
}

export async function broadcastSheetSync(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  sheet: Partial<InitiativeSheet>,
): Promise<void> {
  const version = await incrementSheetVersion(supabase, encounterId)
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('sync', { version, sheet })
}

export async function broadcastSheetDeleted(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
): Promise<void> {
  const channel = supabase.channel(`sheet:${encounterId}`)

  await channel.httpSend('deleted', {})
}
