import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import ConsentBanner from '~/components/atoms/ConsentBanner'

let consentState: any

mockNuxtImport('useConsent', () => () => consentState)

describe('ConsentBanner', async () => {
  beforeEach(() => {
    consentState = {
      showPopup: true,
      consents: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
      consentTypes: ['necessary', 'analytics', 'marketing'],
      toggleConsent: vi.fn(),
      acceptAll: vi.fn(),
      rejectAll: vi.fn(),
      savePreferences: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('Should match snapshot when banner is visible', async () => {
    const component = await mountSuspended(ConsentBanner)

    expect(component.html()).toMatchSnapshot()
  })

  it('Should show banner when showPopup is true', async () => {
    const component = await mountSuspended(ConsentBanner)

    expect(component.find('[data-test-banner]').exists()).toBeTruthy()
  })

  it('Should hide banner when showPopup is false', async () => {
    consentState.showPopup = false

    const component = await mountSuspended(ConsentBanner)

    expect(component.find('[data-test-banner]').exists()).toBeFalsy()
  })

  it('Should call acceptAll when accept all button is clicked', async () => {
    const component = await mountSuspended(ConsentBanner)

    const acceptButton = component.find('[data-test-accept-all]')
    await acceptButton?.trigger('click')

    expect(consentState.acceptAll).toHaveBeenCalled()
  })

  it('Should call rejectAll when reject all button is clicked', async () => {
    const component = await mountSuspended(ConsentBanner)

    const rejectButton = component.find('[data-test-reject-all]')
    await rejectButton?.trigger('click')

    expect(consentState.rejectAll).toHaveBeenCalled()
  })

  it('Should show settings view when customize button is clicked', async () => {
    const component = await mountSuspended(ConsentBanner)

    const customizeButton = component.find('[data-test-customize]')
    await customizeButton?.trigger('click')

    const settingsView = component.find('[data-test-banner-settings]')
    expect(settingsView.exists()).toBeTruthy()
  })

  it('Should display all consent types in settings view', async () => {
    const component = await mountSuspended(ConsentBanner)

    const customizeButton = component.find('[data-test-customize]')
    await customizeButton?.trigger('click')

    const consentLabels = component.findAll('[role="switch"]')
    expect(consentLabels.length).toBe(consentState.consentTypes.length)
  })

  it('Should call savePreferences when save settings button is clicked in settings view', async () => {
    const component = await mountSuspended(ConsentBanner)

    const customizeButton = component.find('[data-test-customize]')
    await customizeButton?.trigger('click')

    const saveButton = component.find('[data-test-save-preferences]')
    await saveButton?.trigger('click')

    expect(consentState.savePreferences).toHaveBeenCalled()
  })

  it('Should disable necessary consent toggle', async () => {
    const component = await mountSuspended(ConsentBanner)

    const customizeButton = component.find('[data-test-customize]')
    await customizeButton?.trigger('click')

    const necessarySwitch = component.find('[id="necessary"]')
    expect(necessarySwitch.attributes('disabled')).toBeDefined()
  })
})
