import { configureConsentManager, createConsentManagerStore } from 'c15t'
import { gtag } from '@c15t/scripts/google-tag'
import type { AllConsentNames } from 'c15t'

let consentManager: ReturnType<typeof configureConsentManager>
let c15tStore: ReturnType<typeof createConsentManagerStore>

export function useConsent() {
  const { c15tUrl, gId } = useRuntimeConfig().public

  if (!consentManager) {
    consentManager = configureConsentManager({
      mode: 'c15t',
      backendURL: c15tUrl,
    })
  }

  if (!c15tStore) {
    c15tStore = createConsentManagerStore(consentManager, {
      initialGdprTypes: ['necessary', 'measurement'],
      scripts: [
        gtag({
          id: gId,
          category: 'measurement',
          script: {
            attributes: {
              crossorigin: 'anonymous',
            },
          },
        }),
      ],
    })
  }

  const consents = ref(c15tStore.getState().consents)
  const consentTypes = c15tStore.getState().gdprTypes
  const showPopup = ref(c15tStore?.getState().showPopup ?? false)

  onMounted(() => c15tStore?.subscribe(updateState))

  function updateState() {
    showPopup.value = c15tStore?.getState().showPopup ?? false
    consents.value = c15tStore?.getState().consents
  }

  function toggleConsent(type: AllConsentNames) {
    if (type !== 'necessary') {
      consents.value[type] = !consents.value[type]
    }
  }

  function acceptAll() {
    consentTypes.forEach(type => setConsent(type, true))
    showPopup.value = false
  }

  function rejectAll() {
    consentTypes.forEach((type) => {
      if (type !== 'necessary') setConsent(type, false)
    })
    showPopup.value = false
  }

  function savePreferences() {
    Object.entries(consents.value ?? {}).forEach(([type, value]) => {
      setConsent(type as AllConsentNames, value)
    })
    showPopup.value = false
  }

  function setConsent(type: AllConsentNames, value: boolean) {
    c15tStore?.getState().setConsent(type, value)
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
