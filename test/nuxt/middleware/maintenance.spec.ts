import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { mockFrom, mockTo } from '~~/test/nuxt/fixtures/middleware'
import middleware from '~/middleware/maintenance.global'

let maintenanceEnabled = false
let underMaintenance = false

mockNuxtImport('isMaintenanceEnabled', () => vi.fn(() => maintenanceEnabled))
mockNuxtImport('isUnderMaintenance', () => vi.fn(() => underMaintenance))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Maintenance middleware', async () => {
  it('should redirect to home page when maintenance disabled and path is maintenance', async () => {
    maintenanceEnabled = false
    underMaintenance = false

    await middleware({ ...mockFrom, path: '/maintenance' }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to maintenance page when maintenance enabled', async () => {
    maintenanceEnabled = true
    underMaintenance = true

    await middleware({ ...mockTo, path: '/some-path' }, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/maintenance')
  })
})
