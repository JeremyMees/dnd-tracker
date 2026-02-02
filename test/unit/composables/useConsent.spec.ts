import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest'
import type { useConsent } from '~/composables/useConsent'

let mockShowPopup = true
let mockConsents = { necessary: true, measurement: false }

vi.mock('c15t', () => {
  return {
    configureConsentManager: vi.fn(() => ({ config: {} })),
    createConsentManagerStore: vi.fn(() => {
      const subscribers: Array<() => void> = []

      return {
        getState: () => ({
          consents: mockConsents,
          gdprTypes: ['necessary', 'measurement'],
          showPopup: mockShowPopup,
          setConsent: (type: string, value: boolean) => {
            mockConsents[type as keyof typeof mockConsents] = value
            subscribers.forEach(cb => cb())
          },
        }),
        subscribe: (callback: () => void) => {
          subscribers.push(callback)
        },
      }
    }),
  }
})

vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: { c15tUrl: 'https://test.c15t.dev' },
  }),
}))

describe('useConsent', () => {
  let consent: ReturnType<typeof useConsent>

  beforeEach(async () => {
    vi.resetModules()
    mockShowPopup = true
    mockConsents = { necessary: true, measurement: false }

    const { useConsent } = await import('~/composables/useConsent')
    consent = useConsent()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize the consent manager and store', () => {
    expect(consent).toBeDefined()
    expect(consent.showPopup).toBeDefined()
    expect(consent.consents).toBeDefined()
    expect(consent.consentTypes).toBeDefined()
  })

  it('should have default consent state', () => {
    expect(consent.consents.value).toEqual({
      necessary: true,
      measurement: false,
    })
    expect(consent.consentTypes).toContain('necessary')
    expect(consent.consentTypes).toContain('measurement')
  })

  it('should show popup on initialization', () => {
    expect(consent.showPopup.value).toBeTruthy()
  })

  it('should handle when popup is hidden on initialization', async () => {
    mockShowPopup = false
    const { useConsent } = await import('~/composables/useConsent')
    const consentHidden = useConsent()

    expect(consentHidden.showPopup.value).toBeFalsy()
  })

  it('should accept all consents even when popup is initially false', () => {
    consent.acceptAll()

    expect(consent.showPopup.value).toBeFalsy()
    expect(consent.consents.value.necessary).toBeTruthy()
    expect(consent.consents.value.measurement).toBeTruthy()
  })

  it('should reject all when popup is initially false', () => {
    consent.rejectAll()

    expect(consent.showPopup.value).toBeFalsy()
    expect(consent.consents.value.necessary).toBeTruthy()
    expect(consent.consents.value.measurement).toBeFalsy()
  })

  it('should save preferences when popup is initially false', () => {
    consent.consents.value.measurement = true
    consent.savePreferences()

    expect(consent.showPopup.value).toBeFalsy()
  })

  it('should toggle consent for non-necessary types', () => {
    consent.toggleConsent('measurement')

    expect(consent.consents.value.measurement).toBeTruthy()

    consent.toggleConsent('measurement')

    expect(consent.consents.value.measurement).toBeFalsy()
  })

  it('should not toggle consent for necessary type', () => {
    const initialValue = consent.consents.value.necessary

    consent.toggleConsent('necessary')

    expect(consent.consents.value.necessary).toBe(initialValue)
  })

  it('should accept all consents', () => {
    consent.acceptAll()

    expect(consent.showPopup.value).toBeFalsy()
    expect(consent.consents.value.necessary).toBeTruthy()
    expect(consent.consents.value.measurement).toBeTruthy()
  })

  it('should reject all non-necessary consents', () => {
    consent.rejectAll()

    expect(consent.showPopup.value).toBeFalsy()
    expect(consent.consents.value.necessary).toBeTruthy()
    expect(consent.consents.value.measurement).toBeFalsy()
  })

  it('should save preferences', () => {
    consent.consents.value.measurement = true
    consent.savePreferences()

    expect(consent.showPopup.value).toBe(false)
  })

  it('should set consent for a specific type', () => {
    consent.setConsent('measurement', true)

    expect(consent.consents.value.measurement).toBe(true)
  })

  it('should return all necessary methods', () => {
    expect(typeof consent.toggleConsent).toBe('function')
    expect(typeof consent.acceptAll).toBe('function')
    expect(typeof consent.rejectAll).toBe('function')
    expect(typeof consent.savePreferences).toBe('function')
    expect(typeof consent.setConsent).toBe('function')
  })
})
