import { useToast } from '~/components/ui/toast'

export function useHealthCheck() {
  const { t } = useI18n()
  const { toast } = useToast()

  const isOnline = useOnline()

  watch(
    () => isOnline.value,
    () => {
      toast({
        title: t(
          `components.healthCheck.${isOnline.value ? 'online' : 'offline'}.title`,
        ),
        description: t(
          `components.healthCheck.${isOnline.value ? 'online' : 'offline'}.text`,
        ),
        variant: isOnline.value ? 'success' : 'destructive',
      })
    },
  )
}
