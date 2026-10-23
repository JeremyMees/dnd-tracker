import { beforeEach, describe, expect, it } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockChain,
  mockFrom,
  serverSupabaseUser,
} from '~~/test/unit/stubs/supabase'
import { storedSheet, useMemorySheet } from '~~/test/unit/stubs/sheet-changes'
import handler from '~~/server/api/encounter/[id]/sync.post'

const sheet = storedSheet({ round: 2 })

const liveSession: SheetLiveSession = { uuid: 'session-uuid', seats: [] }

function syncEvent(body?: Record<string, unknown>) {
  return mockEvent({
    method: 'POST',
    path: '/api/encounter/7/sync',
    params: { id: '7' },
    body,
  })
}

function mockAccess(createdBy = 'user-1') {
  mockFrom({
    initiative_sheets: mockChain({
      data: { id: 7, campaign: null, createdBy },
      error: null,
    }),
  })
}

describe('POST /api/encounter/[id]/sync', () => {
  beforeEach(() => {
    serverSupabaseUser.mockResolvedValue({
      sub: 'user-1',
      email: 'dm@test.com',
    })
  })

  it('sends the stored sheet to the sheet channel', async () => {
    mockAccess()
    const { sent } = useMemorySheet(sheet, { liveSession })

    await expect(handler(syncEvent())).resolves.toEqual({ synced: true })

    expect(sent('sheet:7')).toEqual([
      { topic: 'sheet:7', event: 'sync', payload: { version: 1, sheet } },
    ])
    expect(sent('live:session-uuid')).toEqual([])
  })

  it('also syncs the active live session when asked to', async () => {
    mockAccess()
    const { sent } = useMemorySheet(sheet, { liveSession })

    await handler(syncEvent({ live: true }))

    expect(sent('live:session-uuid')).toEqual([
      {
        topic: 'live:session-uuid',
        event: 'sync',
        payload: { version: 1, sheet: toPlayerSheet(sheet) },
      },
    ])
  })

  it('throws a 403 when the user has no access to the encounter', async () => {
    mockAccess('someone-else')

    await expect(handler(syncEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('throws a 401 when the request is not authenticated', async () => {
    serverSupabaseUser.mockResolvedValue(null)

    await expect(handler(syncEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})
