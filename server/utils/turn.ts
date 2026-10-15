import type { serverSupabaseServiceRole } from '#supabase/server'

interface AdvanceEncounterTurnOptions {
  actorId?: string | null
  actorName?: string | null
  session?: string
  broadcastReminders?: boolean
}

function expiredEvents(
  reminders: TurnReminder[],
): Map<string, CombatEventDraft[]> {
  const events = new Map<string, CombatEventDraft[]>()

  for (const { rowId, rowName, condition } of reminders) {
    events.set(rowId, [
      ...(events.get(rowId) ?? []),
      {
        type: 'condition_expired',
        payload: {
          rowName,
          condition: { id: condition.id, name: condition.name },
        },
      },
    ])
  }

  return events
}

export async function advanceEncounterTurn(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  sheet: Pick<InitiativeSheet, 'activeIndex' | 'round' | 'rows'>,
  {
    actorId,
    actorName,
    session,
    broadcastReminders,
  }: AdvanceEncounterTurnOptions = {},
): Promise<TurnResult> {
  const advance = advanceTurn(sheet)
  const rowsChanged = advance.rows.some(
    (row, index) => row !== sheet.rows[index],
  )

  const { data: updated, error } = await supabase
    .from('initiative_sheets')
    .update({
      activeIndex: advance.activeIndex,
      round: advance.round,
      ...(rowsChanged && { rows: advance.rows }),
    })
    .eq('id', encounterId)
    .eq('activeIndex', sheet.activeIndex)
    .eq('round', sheet.round)
    .select('id, title, round, activeIndex, rows, settings')
    .maybeSingle()

  if (error) throw createError(postgresErrorToH3Error(error))

  if (!updated) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Turn already advanced',
    })
  }

  for (const [rowId, events] of expiredEvents(advance.expired)) {
    await logCombatEvents(supabase, {
      encounterId,
      rowId,
      round: advance.round,
      actorId,
      actorName,
      events,
    })
  }

  const liveSession =
    session ?? (await activeLiveSession(supabase, encounterId))

  if (liveSession) {
    await broadcastLiveState(supabase, liveSession, toPlayerSheet(updated))
  }

  const reminders = { expired: advance.expired, saves: advance.saves }

  await broadcastSheetSync(
    supabase,
    encounterId,
    updated,
    broadcastReminders ? reminders : undefined,
  )

  return { sheet: updated, ...reminders }
}
