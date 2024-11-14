export function useToast() {
  const toasts = useState<Toast[]>('toasts', () => ([]))
  const { t } = useI18n()

  function remove(uuid: string): void {
    toasts.value = toasts.value.filter(obj => obj.uuid !== uuid)
  }

  function add(newToast: CreateToast, type: ToastType): string {
    const toast: Toast = {
      timeout: newToast.timeout || 5000,
      title: newToast.title ? newToast.title : type === 'error' ? t('general.error.title') : '',
      text: newToast.text ? newToast.text : type === 'error' ? t('general.error.text') : '',
      actions: newToast.actions || [],
      timed: newToast.timed ?? true,
      uuid: self.crypto.randomUUID(),
      type,
    }

    const toastExists: boolean = toasts.value
      .findIndex(({ title }) => title === toast.title) > -1

    if (!toastExists) {
      if (toasts.value.length > 4) {
        toasts.value.shift()
      }

      toasts.value = [...toasts.value, toast]
    }

    return toast.uuid
  }

  function success(toast: CreateToast): string {
    return add(toast, 'success')
  }

  function warn(toast: CreateToast): string {
    return add(toast, 'warn')
  }

  function error(toast: CreateToast = {}): string {
    return add(toast, 'error')
  }

  function info(toast: CreateToast): string {
    return add(toast, 'info')
  }

  return {
    toasts,
    remove,
    add,
    success,
    warn,
    error,
    info,
  }
}
