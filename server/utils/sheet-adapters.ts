import type { serverSupabaseServiceRole } from '#supabase/server'

type ServiceClient = ReturnType<typeof serverSupabaseServiceRole<DB>>

export function topicName(topic: SheetTopic): string {
  return topic.kind === 'sheet'
    ? `sheet:${topic.encounterId}`
    : `live:${topic.session}`
}

export function supabaseSheetStore(supabase: ServiceClient): SheetStore {
  return {
    async read(encounterId) {
      const { data, error } = await supabase
        .from('initiative_sheets')
        .select(
          'id, title, round, activeIndex, rows, settings, info, infoCards',
        )
        .eq('id', encounterId)
        .single()

      if (error) throw createError(postgresErrorToH3Error(error))

      return data
    },
    async patchRows(encounterId, patches) {
      if (patches.length === 1) {
        const [{ rowId, patch }] = patches as [SheetRowPatch]
        const { data, error } = await supabase.rpc('apply_live_action', {
          p_encounter: encounterId,
          p_row_id: rowId,
          p_patch: patch,
        })

        if (error) throw createError(postgresErrorToH3Error(error))

        return [data]
      }

      const { data, error } = await supabase.rpc('apply_live_actions', {
        p_encounter: encounterId,
        p_patches: Object.fromEntries(
          patches.map(({ rowId, patch }) => [rowId, patch]),
        ),
      })

      if (error) throw createError(postgresErrorToH3Error(error))

      return data
    },
    async updateTurn(encounterId, from, to) {
      const { data, error } = await supabase
        .from('initiative_sheets')
        .update(to)
        .eq('id', encounterId)
        .eq('activeIndex', from.activeIndex)
        .eq('round', from.round)
        .select('id, title, round, activeIndex, rows, settings')
        .maybeSingle()

      if (error) throw createError(postgresErrorToH3Error(error))

      return data ?? undefined
    },
    async liveSession(encounterId) {
      const { data } = await supabase
        .from('live_sessions')
        .select('uuid, seats')
        .eq('encounter', encounterId)
        .is('endedAt', null)
        .gt('expiresAt', new Date().toISOString())
        .maybeSingle()

      return data ?? undefined
    },
    async logEvents(events) {
      if (!events.length) return

      const { error } = await supabase.from('combat_events').insert(events)

      if (error) throw createError(postgresErrorToH3Error(error))
    },
  }
}

export function realtimeBroadcaster(supabase: ServiceClient): SheetBroadcaster {
  return {
    async nextVersion(topic) {
      const { data, error } =
        topic.kind === 'sheet'
          ? await supabase.rpc('increment_sheet_version', {
              p_encounter: topic.encounterId,
            })
          : await supabase.rpc('increment_live_version', {
              p_session: topic.session,
            })

      if (error) throw createError(postgresErrorToH3Error(error))

      return data
    },
    async send(topic, event, payload) {
      await supabase.channel(topicName(topic)).httpSend(event, payload)
    },
  }
}
