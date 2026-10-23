import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import { mockChain, mockFrom } from '~~/test/unit/stubs/supabase'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockStorage } from '~~/test/unit/stubs/storage'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
import { signLiveSeatToken } from '~~/server/utils/live-token'
import handler from '~~/server/api/encounter/live/action.post'

const future = new Date(Date.now() + 60_000).toISOString()

const session = {
  seats: [
    { seat: 'seat-1', row: 'row-1', name: 'Elara', spectator: false },
    { seat: 'seat-2', row: null, name: 'Watcher', spectator: true },
  ],
  expiresAt: future,
  endedAt: null,
}

const row: InitiativeSheetRow = {
  id: 'row-1',
  index: 0,
  initiative: 10,
  name: 'Elara',
  type: 'player',
  conditions: [],
  hitPoints: 10,
  maxHitPoints: 20,
}

const otherRow: InitiativeSheetRow = { ...row, id: 'row-2', name: 'Goblin' }

function actionEvent(body: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '1.2.3.4' },
  })
}

function seatToken(overrides: Partial<Record<string, unknown>> = {}) {
  return signLiveSeatToken(
    {
      session: 'session-uuid',
      encounter: 7,
      seat: 'seat-1',
      name: 'Elara',
      spectator: false,
      ...overrides,
    } as never,
    new Date(Date.now() + 60_000),
  )
}

function setup(
  sheet: Partial<StoredSheet> = {},
  liveSession: Record<string, unknown> | null = session,
) {
  mockFrom({
    live_sessions: mockChain({ data: liveSession, error: null }),
    srd_conditions: mockChain({ data: null, error: null }),
  })

  return useMemorySheet(storedSheet({ rows: [row], ...sheet }))
}

async function act(action: Record<string, unknown>, token?: string) {
  return handler(
    actionEvent({ seatToken: token ?? (await seatToken()), action }),
  )
}

describe('POST /api/encounter/live/action', () => {
  beforeEach(() => {
    mockRuntimeConfig({ jwtSecret: 'test-secret' })
    mockStorage()
  })

  it("heals the seat's claimed row, logs it for the seat and tells the DM", async () => {
    const { state, sent } = setup({ round: 3 })

    const result = await act({ type: 'hp', hpType: 'heal', amount: 5 })

    expect(result).toEqual({ row: { ...row, hitPoints: 15 } })
    expect(state.sheet.rows).toEqual([{ ...row, hitPoints: 15 }])
    expect(state.events).toEqual([
      {
        encounterId: 7,
        rowId: 'row-1',
        round: 3,
        type: 'hp',
        payload: {
          rowName: 'Elara',
          kind: 'heal',
          amount: 5,
          before: 10,
          after: 15,
        },
        createdBy: null,
        actorName: 'Elara',
      },
    ])
    expect(sent('sheet:7')).toEqual([
      {
        topic: 'sheet:7',
        event: 'action',
        payload: { version: 1, row: 'row-1', patch: { hitPoints: 15 } },
      },
    ])
  })

  it('shows the other players a health band instead of raw hp', async () => {
    const { sent } = setup()

    await act({ type: 'hp', hpType: 'damage', amount: 3 })

    expect(sent('live:session-uuid')).toEqual([
      {
        topic: 'live:session-uuid',
        event: 'action',
        payload: {
          version: 1,
          row: expect.objectContaining({ id: 'row-1', healthBand: 'bloodied' }),
        },
      },
    ])
    expect(sent('live:session-uuid')[0]?.payload.row).not.toHaveProperty(
      'hitPoints',
    )
  })

  it('shows the other players nothing of a death save', async () => {
    const { state, sent } = setup()
    const value = { save: [true, false, false], fail: [false, false, false] }

    await act({ type: 'deathSaves', value })

    expect(state.sheet.rows[0]?.deathSaves).toEqual(value)
    expect(sent('live:session-uuid')[0]?.payload.row).not.toHaveProperty(
      'deathSaves',
    )
  })

  it('shows the raw hp of a non-player row', async () => {
    const { sent } = setup({ rows: [{ ...row, type: 'npc' }] })

    await act({ type: 'hp', hpType: 'heal', amount: 5 })

    expect(sent('live:session-uuid')[0]?.payload.row).toMatchObject({
      hitPoints: 15,
    })
  })

  it('stores and forwards a direct field patch', async () => {
    const { state, sent } = setup()

    await act({ type: 'concentration', value: true })

    expect(state.sheet.rows[0]?.concentration).toBe(true)
    expect(sent('live:session-uuid')[0]?.payload.row).toMatchObject({
      concentration: true,
    })
  })

  it("applies an ac action to the seat's claimed row", async () => {
    const { state } = setup({
      rows: [{ ...row, armorClass: 15, maxArmorClass: 18, tempArmorClass: 0 }],
    })

    await act({ type: 'ac', acType: 'add', amount: 10 })

    expect(state.sheet.rows[0]?.armorClass).toBe(18)
  })

  it('advances the turn and syncs the session when the seat ends its turn', async () => {
    const { state, sent } = setup({ rows: [row, otherRow] })

    await expect(act({ type: 'endTurn' })).resolves.toEqual({ synced: true })

    expect(state.sheet).toMatchObject({ activeIndex: 1, round: 1 })
    expect(sent('live:session-uuid')).toEqual([
      {
        topic: 'live:session-uuid',
        event: 'sync',
        payload: {
          version: 1,
          sheet: expect.objectContaining({ round: 1, activeIndex: 1 }),
        },
      },
    ])
  })

  it('expires a timed condition, credits the seat and sends the reminders to the DM when the turn ends', async () => {
    const prone: DndCondition = {
      id: 'prone',
      name: 'Prone',
      desc: 'On the ground.',
      duration: { rowId: 'row-1', timing: 'end', rounds: 1 },
    }
    const { state, sent } = setup({
      rows: [{ ...row, conditions: [prone] }, otherRow],
    })

    await act({ type: 'endTurn' })

    expect(state.events).toEqual([
      expect.objectContaining({
        rowId: 'row-2',
        type: 'turn',
        actorName: 'Elara',
      }),
      expect.objectContaining({
        rowId: 'row-1',
        type: 'condition_expired',
        actorName: 'Elara',
      }),
    ])
    expect(sent('sheet:7')[0]?.payload.reminders).toEqual({
      expired: [{ rowId: 'row-1', rowName: 'Elara', condition: prone }],
      saves: [],
      recharges: [],
    })
  })

  it('wraps to the first row and the next round when ending the last turn', async () => {
    const { state } = setup({ activeIndex: 1, rows: [otherRow, row] })

    await act({ type: 'endTurn' })

    expect(state.sheet).toMatchObject({ activeIndex: 0, round: 2 })
  })

  it.each([
    ['endTurn', { type: 'endTurn' }],
    ['concentration', { type: 'concentration', value: true }],
  ])('refuses %s when the DM has disabled it', async (type, action) => {
    const { state } = setup({
      settings: {
        spacing: 'normal',
        modified: false,
        live: { allow: { [type]: false } },
      } as StoredSheet['settings'],
    })

    await expect(act(action)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Action not allowed',
    })

    expect(state.messages).toEqual([])
  })

  it('throws a 403 when the seat is a spectator', async () => {
    setup()

    await expect(
      act(
        { type: 'concentration', value: true },
        await seatToken({ seat: 'seat-2', spectator: true }),
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Spectators cannot act',
    })
  })

  it('throws a 404 when the live session no longer exists', async () => {
    setup({}, null)

    await expect(
      act({ type: 'concentration', value: true }),
    ).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Live session not found',
    })
  })

  it.each([
    ['has ended', { endedAt: new Date().toISOString() }],
    ['has expired', { expiresAt: new Date(Date.now() - 1000).toISOString() }],
  ])('throws a 410 when the session %s', async (_label, change) => {
    setup({}, { ...session, ...change })

    await expect(
      act({ type: 'concentration', value: true }),
    ).rejects.toMatchObject({
      statusCode: 410,
      statusMessage: 'Live session has ended',
    })
  })

  it.each([
    ['was kicked', { seat: 'seat-missing' }],
    ['has no claimed row', { seat: 'seat-2' }],
  ])('throws a 403 when the seat %s', async (_label, overrides) => {
    setup()

    await expect(
      act({ type: 'concentration', value: true }, await seatToken(overrides)),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'No row claimed',
    })
  })

  it.each([
    ['concentration', { type: 'concentration', value: true }],
    ['readying an action', { type: 'ready', value: true }],
  ])("refuses %s when it is not the seat's turn", async (_label, action) => {
    const { state } = setup({ activeIndex: 1, rows: [row, otherRow] })

    await expect(act(action)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Not your turn',
    })

    expect(state.sheet.rows).toEqual([row, otherRow])
  })

  it("marks the reaction as used outside the seat's turn", async () => {
    const ownRow = { ...row, resources: { legendaryResistances: 1 } }
    const { state, sent } = setup({ activeIndex: 1, rows: [ownRow, otherRow] })

    await act({ type: 'reaction', value: true })

    expect(state.sheet.rows[0]?.resources).toEqual({
      legendaryResistances: 1,
      reaction: true,
    })
    expect(sent('live:session-uuid')[0]?.payload.row).toMatchObject({
      reaction: true,
    })
  })

  it('drops the reaction from the resources when it is cleared', async () => {
    const { state } = setup({
      rows: [{ ...row, resources: { reaction: true } }],
    })

    await act({ type: 'reaction', value: false })

    expect(state.sheet.rows[0]?.resources).toEqual({})
  })

  it('readies an action on the turn of the seat and logs it', async () => {
    const { state, sent } = setup()

    await act({ type: 'ready', value: true })

    expect(state.sheet.rows[0]?.readied).toBe(true)
    expect(state.events).toEqual([
      expect.objectContaining({ type: 'readied', actorName: 'Elara' }),
    ])
    expect(sent('live:session-uuid')[0]?.payload.row).toMatchObject({
      readied: true,
    })
  })

  it("uses a readied action outside the seat's turn and spends the reaction", async () => {
    const ownRow = {
      ...row,
      readied: true,
      resources: { legendaryResistances: 1 },
    }
    const { state } = setup({ activeIndex: 1, rows: [ownRow, otherRow] })

    await act({ type: 'ready', value: false })

    expect(state.sheet.rows[0]).toMatchObject({
      readied: false,
      resources: { legendaryResistances: 1, reaction: true },
    })
    expect(state.events).toEqual([
      expect.objectContaining({ type: 'ready_used' }),
    ])
  })

  it("throws a 404 when the seat's row was removed from the encounter", async () => {
    setup({ rows: [otherRow] })

    await expect(act({ type: 'reaction', value: true })).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'Row not found',
    })
  })

  it('throws a validation error for an unknown action type', async () => {
    const token = await seatToken()

    await expect(
      handler(actionEvent({ seatToken: token, action: { type: 'teleport' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('throws a 401 for an invalid seat token', async () => {
    await expect(
      handler(
        actionEvent({
          seatToken: 'not-a-jwt',
          action: { type: 'concentration', value: true },
        }),
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      statusMessage: 'Invalid live session token',
    })
  })

  it('throws a 429 after too many actions from the same seat', async () => {
    const token = await seatToken({ seat: 'seat-2', spectator: true })
    const action = { type: 'concentration', value: true }

    for (let i = 0; i < 60; i++) {
      await expect(
        handler(actionEvent({ seatToken: token, action })),
      ).rejects.toMatchObject({ statusCode: 403 })
    }

    await expect(
      handler(actionEvent({ seatToken: token, action })),
    ).rejects.toMatchObject({
      statusCode: 429,
      statusMessage: 'Too many requests',
    })
  })

  it('rate-limits each seat separately on a shared IP', async () => {
    const spectator = await seatToken({ seat: 'seat-2', spectator: true })
    const other = await seatToken({ seat: 'seat-3', spectator: true })
    const action = { type: 'concentration', value: true }

    for (let i = 0; i < 60; i++) {
      await expect(
        handler(actionEvent({ seatToken: spectator, action })),
      ).rejects.toMatchObject({ statusCode: 403 })
    }

    await expect(
      handler(actionEvent({ seatToken: other, action })),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Spectators cannot act',
    })
  })
})
