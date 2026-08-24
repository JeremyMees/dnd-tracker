import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  mockChain,
  mockFrom,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/campaign/transfer-ownership.post'

const newOwner = '11111111-1111-4111-8111-111111111111'

function body(overrides: Record<string, unknown> = {}) {
  return { campaign: 42, user: newOwner, role: 'Admin', ...overrides }
}

function mockTables({
  campaign = {
    data: { id: 42, title: 'Skyspire', createdBy: 'user-1' },
    error: null,
  },
  member,
  rpc = { error: null },
}: {
  campaign?: Record<string, unknown>
  member?: Record<string, unknown>
  rpc?: Record<string, unknown>
} = {}) {
  const tables: Record<string, ReturnType<typeof mockChain>> = {
    campaigns: mockChain(campaign),
  }

  if (member) tables.team = mockChain(member)

  const rpcChain = mockChain(rpc)
  mockFrom(tables, { rpc: rpcChain })

  return { rpcChain }
}

describe('POST /api/campaign/transfer-ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthedUser({ sub: 'user-1', email: 'dm@example.com' })
  })

  it('calls the transfer rpc with the caller and the new owner', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).resolves.toBeUndefined()
  })

  it('passes the picked role through to the rpc', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body({ role: 'Remove' }) })),
    ).resolves.toBeUndefined()
  })

  it('throws a 403 when the caller is not the owner', async () => {
    mockTables({
      campaign: {
        data: { id: 42, title: 'Skyspire', createdBy: 'someone-else' },
        error: null,
      },
      member: { data: { role: 'Admin' }, error: null },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws a 404 when the campaign does not exist', async () => {
    mockTables({ campaign: { data: null, error: { message: 'no rows' } } })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('maps a raised rpc exception to a 409', async () => {
    mockTables({
      rpc: {
        error: {
          code: 'P0001',
          message: 'New owner must be a team member',
          details: '',
          hint: '',
        },
      },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Conflict',
    })
  })

  it('maps other postgres errors by code', async () => {
    mockTables({
      rpc: {
        error: {
          code: '08006',
          message: 'connection failure',
          details: '',
          hint: '',
        },
      },
    })

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
    })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: body() })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('rejects a role outside the transfer options', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body({ role: 'Owner' }) })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })

  it('rejects a non-uuid new owner', async () => {
    mockTables()

    await expect(
      handler(mockEvent({ method: 'POST', body: body({ user: 'nope' }) })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})
