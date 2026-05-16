import { getOrCreateConsentRuntime } from 'c15t'
import { gtag } from '@c15t/scripts/google-tag'
import type { AllConsentNames } from 'c15t'

export function useConsent() {
  const { c15tUrl, gId } = useRuntimeConfig().public

  const { consentStore } = getOrCreateConsentRuntime({
    mode: 'hosted',
    backendURL: c15tUrl as string,
    consentCategories: ['necessary', 'measurement'],
    scripts: [
      gtag({
        id: gId,
        category: 'measurement',
      }),
    ],
  })

  const state = consentStore.getState()
  const consents = ref(state.consents)
  const consentTypes = state.consentTypes.filter(t =>
    state.consentCategories.includes(t.name),
  )
  const showPopup = ref(state.activeUI !== 'none')

  consentStore.subscribe(updateState)

  function updateState() {
    showPopup.value = consentStore.getState().activeUI !== 'none'
    consents.value = consentStore.getState().consents
  }

  function toggleConsent(type: AllConsentNames) {
    if (type !== 'necessary') {
      consents.value[type] = !consents.value[type]
    }
  }

  function acceptAll() {
    consentTypes.forEach(type => setConsent(type.name, true))
    consentStore.getState().setActiveUI('none')
  }

  function rejectAll() {
    consentTypes.forEach((type) => {
      if (type.name !== 'necessary') setConsent(type.name, false)
    })
    consentStore.getState().setActiveUI('none')
  }

  function savePreferences() {
    Object.entries(consents.value ?? {}).forEach(([type, value]) => {
      setConsent(type as AllConsentNames, value)
    })
    consentStore.getState().setActiveUI('none')
  }

  function setConsent(type: AllConsentNames, value: boolean) {
    consentStore.getState().setConsent(type, value)
  }

  return {
    showPopup,
    consents,
    consentTypes,
    setConsent,
    toggleConsent,
    acceptAll,
    rejectAll,
    savePreferences,
  }
}
