import { driver } from 'driver.js'
import type { DriveStep, Driver } from 'driver.js'
import 'driver.js/dist/driver.css'

import playground from '@/constants/initiative-examples.json'

export function useTour() {
  const { user } = useAuthentication()
  const { t } = useI18n()
  const { mutateAsync: updateProfile } = useProfileUpdate()

  const isTourActive = useState<boolean>('tour-active', () => false)
  const isTourWithCampaign = useState<boolean>('tour-with-campaign', () => false)
  const isTourCompleted = useCookie<boolean>('tour-completed')
  const tourData = ref<InitiativeSheet>()
  const driverObj = ref<Driver>()
  const tourSteps = 13

  const steps = computed<DriveStep[]>(() => {
    const steps: DriveStep[] = []

    for (let i = 0; i < tourSteps; i++) {
      if (!isTourWithCampaign.value && i === 5) {
        continue
      }

      steps.push({
        element: `#tour-${i}`,
        popover: {
          title: t(`tour.${i}.title`),
          description: i === (tourSteps - 1)
            ? '<div style="width:100%;height:0;padding-bottom:56%;position:relative;"><iframe src="https://giphy.com/embed/xT8qBepJQzUjXpeWU8" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/olympics-shaun-the-sheep-aardman-xT8qBepJQzUjXpeWU8">via GIPHY</a></p>'
            : t(`tour.${i}.description`),
        },
      })
    }

    return steps
  })

  function initializeTour(): void {
    driverObj.value?.destroy()

    driverObj.value = driver({
      showProgress: true,
      smoothScroll: true,
      disableActiveInteraction: true,
      nextBtnText: t('actions.next'),
      prevBtnText: t('actions.prev'),
      doneBtnText: t('actions.finish'),
      steps: steps.value,
      onCloseClick: () => close(),
      onDestroyed: () => close(),
      onDestroyStarted: () => {
        if (!driverObj.value?.hasNextStep() || confirm(t('tour.sure'))) {
          close()
        }
      },
    })

    driverObj.value.drive()
  }

  async function close(): Promise<void> {
    if (user.value) await updateProfile({ data: { completedTour: true }, id: user.value.id })
    else isTourCompleted.value = true

    isTourActive.value = false
    isTourWithCampaign.value = false
    tourData.value = undefined
    driverObj.value?.destroy()
  }

  async function startTour(campaign: boolean = false): Promise<void> {
    if (user.value && !user.value.completedTour) {
      await until(!!user.value.completedTour).toBe(true, { timeout: 1000 })
    }

    if (user.value?.completedTour || isTourCompleted.value) return

    isTourActive.value = true
    isTourWithCampaign.value = campaign
    tourData.value = playground as unknown as InitiativeSheet

    initializeTour()
  }

  return {
    tourData,
    isTourActive,
    startTour,
  }
}
