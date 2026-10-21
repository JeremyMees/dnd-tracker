import type { serverSupabaseServiceRole } from '#supabase/server'

interface AdvanceEncounterTurnOptions {
  actorId?: string | null
  actorName?: string | null
  session?: string
  broadcastReminders?: boolean
}

function expiredEvents(reminders: TurnReminder[]): CombatEventDraft[] {
  return reminders.map(({ rowId, rowName, condition }) => ({
    type: 'condition_expired',
    rowId,
    payload: {
      rowName,
      condition: { id: condition.id, name: condition.name },
    },
  }))
}

export async function advanceEncounterTurn(
  supabase: ReturnType<typeof serverSupabaseServiceRole<DB>>,
  encounterId: number,
  sheet: Pick<InitiativeSheet, 'activeIndex' | 'round' | 'rows'> &
    Partial<Pick<InitiativeSheet, 'settings'>>,
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

  const turn = turnEvent(advance.rows, advance.activeIndex)

  await logCombatEvents(supabase, {
    encounterId,
    round: advance.round,
    actorId,
    actorName,
    events: [...(turn ? [turn] : []), ...expiredEvents(advance.expired)],
  })

  const liveSession =
    session ?? (await activeLiveSession(supabase, encounterId))

  if (liveSession) {
    await broadcastLiveState(supabase, liveSession, toPlayerSheet(updated))
  }

  const reminders = {
    expired: advance.expired,
    saves: advance.saves,
    recharges: advance.recharges,
  }

  await broadcastSheetSync(
    supabase,
    encounterId,
    updated,
    broadcastReminders ? reminders : undefined,
  )

  return { sheet: updated, ...reminders }
}
