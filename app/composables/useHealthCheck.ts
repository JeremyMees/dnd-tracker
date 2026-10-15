import { toast } from 'vue-sonner'

export function useHealthCheck() {
  const { t } = useI18n()

  const isOnline = useOnline()

  watch(
    () => isOnline.value,
    () => {
      const status = isOnline.value ? 'online' : 'offline'
      const show = isOnline.value ? toast.success : toast.error

      show(t(`components.healthCheck.${status}.title`), {
        description: t(`components.healthCheck.${status}.text`),
      })
    },
  )
}
