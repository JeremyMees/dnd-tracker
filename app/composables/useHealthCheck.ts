import { useToast } from '~/components/ui/toast'

export function useHealthCheck() {
  const { t } = useI18n()
  const { toast } = useToast()

  const isOnline = useOnline()
  const isOpen5eOnline = ref(true)

  onNuxtReady(() => checkOpen5e())

  useInterval(300000, { callback: checkOpen5e })

  watch(() => isOnline.value, () => {
    toast({
      title: t(`components.healthCheck.${isOnline.value ? 'online' : 'offline'}.title`),
      description: t(`components.healthCheck.${isOnline.value ? 'online' : 'offline'}.text`),
      variant: isOnline.value ? 'success' : 'destructive',
    })
  })

  async function checkOpen5e() {
    try {
      const res = await $fetch('https://api.open5e.com/')
      isOpen5eOnline.value = !!res
    }
    catch {
      isOpen5eOnline.value = false
    }

    if (!isOpen5eOnline.value) {
      toast({
        title: t(`components.healthCheck.open5e.title`),
        description: t(`components.healthCheck.open5e.text`),
        variant: 'warning',
      })
    }
  }
}
