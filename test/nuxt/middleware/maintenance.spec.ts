import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import middleware from '@/middleware/maintenance.global.ts'

let maintenanceEnabled = false
let underMaintenance = false
const from = { path: '/another-path' }

mockNuxtImport('isMaintenanceEnabled', () => vi.fn(() => maintenanceEnabled))
mockNuxtImport('isUnderMaintenance', () => vi.fn(() => underMaintenance))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Maintenance middleware', async () => {
  it('should redirect to home page when maintenance disabled and path is maintenance', async () => {
    maintenanceEnabled = false
    underMaintenance = false
    const to = { path: '/maintenance' }
    await middleware(to, from)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should redirect to maintenance page when maintenance enabled', async () => {
    maintenanceEnabled = true
    underMaintenance = true
    const to = { path: '/some-path' }

    await middleware(to, from)

    expect(navigateTo).toHaveBeenCalledWith('/maintenance')
  })
})
