import { toast } from 'vue-sonner'

const toastByVariant = {
  default: toast,
  destructive: toast.error,
  info: toast.info,
  success: toast.success,
  warning: toast.warning,
} satisfies Record<ToastVariant, typeof toast.info>

export function useToastItems() {
  const { t } = useI18n()

  return function showToastItems(toasts: ToastItem[]): void {
    toasts.forEach(({ title, description, variant = 'default' }) => {
      toastByVariant[variant](t(title[0], title[1] ?? {}), {
        description: t(description[0], description[1] ?? {}),
      })
    })
  }
}
