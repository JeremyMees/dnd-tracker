import { describe, expect, it } from 'vitest'
import {
  mockChain,
  mockFrom,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import {
  realtimeBroadcaster,
  supabaseSheetStore,
  topicName,
} from '~~/server/utils/sheet-adapters'

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
}

const postgresError = { code: '23514', message: 'violates check constraint' }

function client() {
  return serverSupabaseServiceRole({} as never)
}

describe('sheet-adapters', () => {
  describe('topicName', () => {
    it.each([
      [{ kind: 'sheet', encounterId: 7 }, 'sheet:7'],
      [{ kind: 'live', session: 'session-uuid' }, 'live:session-uuid'],
    ] as const)('names %o as %s', (topic, name) => {
      expect(topicName(topic)).toBe(name)
    })
  })

  describe('supabaseSheetStore', () => {
    it('reads every column a change or a sync needs', async () => {
      const chain = mockChain({ data: { id: 7 }, error: null })

      mockFrom({ initiative_sheets: chain })

      await expect(supabaseSheetStore(client()).read(7)).resolves.toEqual({
        id: 7,
      })
      expect(chain.select).toHaveBeenCalledWith(
        'id, title, round, activeIndex, rows, settings, info, infoCards',
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 7)
    })

    it('throws when the sheet cannot be read', async () => {
      mockFrom({
        initiative_sheets: mockChain({ data: null, error: postgresError }),
      })

      await expect(supabaseSheetStore(client()).read(7)).rejects.toThrow()
    })

    it('patches one row through apply_live_action', async () => {
      mockFrom({}, { rpc: mockChain({ data: row, error: null }) })

      await expect(
        supabaseSheetStore(client()).patchRows(7, [
          { rowId: 'row-1', patch: { hitPoints: 6 } },
        ]),
      ).resolves.toEqual([row])
      expect(client().rpc).toHaveBeenCalledWith('apply_live_action', {
        p_encounter: 7,
        p_row_id: 'row-1',
        p_patch: { hitPoints: 6 },
      })
    })

    it('patches several rows in one apply_live_actions call', async () => {
      mockFrom({}, { rpc: mockChain({ data: [row, row], error: null }) })

      await supabaseSheetStore(client()).patchRows(7, [
        { rowId: 'row-1', patch: { hitPoints: 6 } },
        { rowId: 'row-2', patch: { hitPoints: 3 } },
      ])

      expect(client().rpc).toHaveBeenCalledWith('apply_live_actions', {
        p_encounter: 7,
        p_patches: { 'row-1': { hitPoints: 6 }, 'row-2': { hitPoints: 3 } },
      })
    })

    it.each([
      ['one row', [{ rowId: 'row-1', patch: {} }]],
      [
        'several rows',
        [
          { rowId: 'row-1', patch: {} },
          { rowId: 'row-2', patch: {} },
        ],
      ],
    ])('throws when patching %s fails', async (_label, patches) => {
      mockFrom({}, { rpc: mockChain({ data: null, error: postgresError }) })

      await expect(
        supabaseSheetStore(client()).patchRows(7, patches),
      ).rejects.toThrow()
    })

    it('finds the active live session of the encounter', async () => {
      const session = { uuid: 'session-uuid', seats: [] }
      const chain = mockChain({ data: session, error: null })

      mockFrom({ live_sessions: chain })

      await expect(
        supabaseSheetStore(client()).liveSession(7),
      ).resolves.toEqual(session)
      expect(chain.eq).toHaveBeenCalledWith('encounter', 7)
      expect(chain.is).toHaveBeenCalledWith('endedAt', null)
      expect(chain.gt).toHaveBeenCalledWith('expiresAt', expect.any(String))
    })

    it('returns no live session when none is running', async () => {
      mockFrom({ live_sessions: mockChain({ data: null, error: null }) })

      await expect(
        supabaseSheetStore(client()).liveSession(7),
      ).resolves.toBeUndefined()
    })

    it('inserts combat events', async () => {
      const event = {
        encounterId: 7,
        round: 1,
        type: 'turn' as const,
        payload: { rowName: 'Elara' },
      }
      const chain = mockChain({ data: null, error: null })

      mockFrom({ combat_events: chain })

      await supabaseSheetStore(client()).logEvents([event])

      expect(chain.insert).toHaveBeenCalledWith([event])
    })

    it('skips the insert when there are no events', async () => {
      const from = mockFrom({})

      await supabaseSheetStore(client()).logEvents([])

      expect(from).not.toHaveBeenCalled()
    })

    it('throws when the events cannot be inserted', async () => {
      mockFrom({
        combat_events: mockChain({ data: null, error: postgresError }),
      })

      await expect(
        supabaseSheetStore(client()).logEvents([
          { encounterId: 7, round: 1, type: 'turn', payload: {} },
        ]),
      ).rejects.toThrow()
    })
  })

  describe('realtimeBroadcaster', () => {
    it('bumps the sheet version of the encounter', async () => {
      mockFrom({}, { rpc: mockChain({ data: 4, error: null }) })

      await expect(
        realtimeBroadcaster(client()).nextVersion({
          kind: 'sheet',
          encounterId: 7,
        }),
      ).resolves.toBe(4)
      expect(client().rpc).toHaveBeenCalledWith('increment_sheet_version', {
        p_encounter: 7,
      })
    })

    it('bumps the live version of the session', async () => {
      mockFrom({}, { rpc: mockChain({ data: 9, error: null }) })

      await expect(
        realtimeBroadcaster(client()).nextVersion({
          kind: 'live',
          session: 'session-uuid',
        }),
      ).resolves.toBe(9)
      expect(client().rpc).toHaveBeenCalledWith('increment_live_version', {
        p_session: 'session-uuid',
      })
    })

    it('throws when the version cannot be bumped', async () => {
      mockFrom({}, { rpc: mockChain({ data: null, error: postgresError }) })

      await expect(
        realtimeBroadcaster(client()).nextVersion({
          kind: 'sheet',
          encounterId: 7,
        }),
      ).rejects.toThrow()
    })

    it('sends the message on the channel of the topic', async () => {
      mockFrom({})

      await realtimeBroadcaster(client()).send(
        { kind: 'sheet', encounterId: 7 },
        'action',
        { version: 1 },
      )

      expect(client().channel).toHaveBeenCalledWith('sheet:7')
      expect(client().channel('sheet:7').httpSend).toHaveBeenCalledWith(
        'action',
        { version: 1 },
      )
    })
  })
})
