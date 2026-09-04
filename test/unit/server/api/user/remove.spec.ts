import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockEvent } from '~~/test/unit/stubs/api-event'
import {
  mockAuthedUser,
  serverSupabaseServiceRole,
} from '~~/test/unit/stubs/supabase'
import handler from '~~/server/api/user/remove.post'

const callerId = '11111111-1111-4111-8111-111111111111'
const otherId = '22222222-2222-4222-8222-222222222222'

function mockDeleteUser(result: Record<string, unknown>) {
  const deleteUser = vi.fn().mockResolvedValue(result)

  serverSupabaseServiceRole.mockReturnValue({
    auth: { admin: { deleteUser } },
  })

  return deleteUser
}

describe('POST /api/user/remove', () => {
  beforeEach(() => {
    mockAuthedUser({ sub: callerId, email: 'dm@example.com' })
  })

  it('deletes the caller when removing their own account', async () => {
    const deleteUser = mockDeleteUser({ data: {}, error: null })

    await expect(
      handler(mockEvent({ method: 'POST', body: { id: callerId } })),
    ).resolves.toEqual({ data: {}, error: null })

    expect(deleteUser).toHaveBeenCalledWith(callerId)
  })

  it('throws a 403 when removing a different account', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { id: otherId } })),
    ).rejects.toMatchObject({ statusCode: 403, statusMessage: 'Forbidden' })
  })

  it('throws a 401 when the user is not authenticated', async () => {
    mockAuthedUser(null)

    await expect(
      handler(mockEvent({ method: 'POST', body: { id: callerId } })),
    ).rejects.toMatchObject({ statusCode: 401 })
  })

  it('throws a validation error for an invalid body', async () => {
    await expect(
      handler(mockEvent({ method: 'POST', body: { id: 'not-a-uuid' } })),
    ).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Validation Error',
    })
  })
})
