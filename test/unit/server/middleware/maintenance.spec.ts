import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import middleware from '~~/server/middleware/maintenance'

const { isMaintenanceEnabled, isUnderMaintenance, sendRedirect } = vi.hoisted(
  () => ({
    isMaintenanceEnabled: vi.fn(),
    isUnderMaintenance: vi.fn(),
    sendRedirect: vi.fn(),
  }),
)

vi.mock('~~/shared/utils/maintenance', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isMaintenanceEnabled,
  isUnderMaintenance,
}))

vi.mock('h3', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  sendRedirect,
}))

function mockEvent(path: string) {
  return { path } as H3Event
}

describe('Maintenance server middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isMaintenanceEnabled.mockReturnValue(true)
    isUnderMaintenance.mockReturnValue(true)
  })

  it('does nothing when maintenance is disabled', async () => {
    isMaintenanceEnabled.mockReturnValue(false)

    await middleware(mockEvent('/api/campaign/1'))

    expect(isUnderMaintenance).not.toHaveBeenCalled()
    expect(sendRedirect).not.toHaveBeenCalled()
  })

  it('redirects to the maintenance page during maintenance', async () => {
    const event = mockEvent('/api/campaign/1')

    await middleware(event)

    expect(sendRedirect).toHaveBeenCalledWith(event, '/maintenance')
  })

  it('excludes the maintenance page from the check', async () => {
    await middleware(mockEvent('/api/campaign/1'))

    expect(isUnderMaintenance).toHaveBeenCalledWith('/api/campaign/1', [
      '/maintenance',
    ])
  })

  it('does not redirect when already on the maintenance page', async () => {
    await middleware(mockEvent('/maintenance'))

    expect(sendRedirect).not.toHaveBeenCalled()
  })

  it('does not redirect for excluded paths', async () => {
    isUnderMaintenance.mockReturnValue(false)

    await middleware(mockEvent('/api/campaign/1'))

    expect(sendRedirect).not.toHaveBeenCalled()
  })
})
