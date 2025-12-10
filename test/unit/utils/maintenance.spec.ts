import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import {
  urlMatches,
  isMaintenanceEnabled,
  isUnderMaintenance,
  throwMaintenanceError,
} from '~~/shared/utils/maintenance'

const mockConfig = { public: { maintenanceMode: false } }

mockNuxtImport('useRuntimeConfig', () => () => mockConfig)

describe('Maintenance utils', () => {
  describe('urlMatches', () => {
    it('should return the correct value if url matches exact pattern', () => {
      expect(urlMatches('/maintenance', ['/maintenance'])).toBeTruthy()
      expect(urlMatches('/home', ['/maintenance'])).toBeFalsy()
    })

    it('should return the correct value if url matches wildcard pattern', () => {
      expect(urlMatches('/admin/user', ['/admin/*'])).toBeTruthy()
      expect(urlMatches('/user/admin', ['/admin/*'])).toBeFalsy()
    })

    it('should return the correct value if url matches any of the patterns', () => {
      expect(urlMatches('/maintenance', ['/home', '/maintenance'])).toBeTruthy()
      expect(urlMatches('/about', ['/home', '/maintenance'])).toBeFalsy()
    })
  })

  describe('isMaintenanceEnabled', () => {
    it('should return maintenanceMode is true', () => {
      mockConfig.public.maintenanceMode = true
      expect(isMaintenanceEnabled()).toBeTruthy()

      mockConfig.public.maintenanceMode = 'true'
      expect(isMaintenanceEnabled()).toBeTruthy()

      mockConfig.public.maintenanceMode = '1'
      expect(isMaintenanceEnabled()).toBeTruthy()

      mockConfig.public.maintenanceMode = 1
      expect(isMaintenanceEnabled()).toBeTruthy()
    })

    it('should return maintenanceMode is false', () => {
      mockConfig.public.maintenanceMode = false
      expect(isMaintenanceEnabled()).toBeFalsy()

      mockConfig.public.maintenanceMode = 'false'
      expect(isMaintenanceEnabled()).toBeFalsy()

      mockConfig.public.maintenanceMode = '0'
      expect(isMaintenanceEnabled()).toBeFalsy()

      mockConfig.public.maintenanceMode = 0
      expect(isMaintenanceEnabled()).toBeFalsy()

      mockConfig.public.maintenanceMode = undefined
      expect(isMaintenanceEnabled()).toBeFalsy()
    })
  })

  describe('isUnderMaintenance', () => {
    it('should return true if exclude is null', () => {
      expect(isUnderMaintenance('/any', null)).toBeTruthy()
    })

    it('should return true if exclude is empty array', () => {
      expect(isUnderMaintenance('/any', [])).toBeTruthy()
    })

    it('should return false if path matches exclude pattern', () => {
      expect(isUnderMaintenance('/maintenance', ['/maintenance'])).toBeFalsy()
    })

    it('should return true if path does not match exclude pattern', () => {
      expect(isUnderMaintenance('/home', ['/maintenance'])).toBeTruthy()
    })

    it('should return false if path matches any exclude pattern', () => {
      expect(isUnderMaintenance('/admin/user', ['/admin/*'])).toBeFalsy()
    })

    it('should return true if path does not match any exclude pattern', () => {
      expect(isUnderMaintenance('/user/admin', ['/admin/*'])).toBeTruthy()
    })
  })

  describe('throwMaintenanceError', () => {
    it('should throw an error with statusCode 503 and statusMessage', () => {
      expect(() => throwMaintenanceError()).toThrow()

      try {
        throwMaintenanceError()
      }
      catch (error: any) {
        expect(error.statusCode).toBe(503)
        expect(error.statusMessage).toBe('Site is under maintenance')
      }
    })
  })
})
