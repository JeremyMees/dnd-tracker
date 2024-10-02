export const useToast = defineStore('useToast', () => {
  const { t } = useI18n()

  const toasts = ref<Toast[]>([])

  function remove(key: number): void {
    toasts.value = toasts.value.filter(obj => obj.key !== key)
  }

  function add(newToast: CreateToast, type: ToastType): number {
    const toast: Toast = {
      timeout: newToast.timeout || 5000,
      title: newToast.title ? newToast.title : type === 'error' ? t('general.error.title') : '',
      text: newToast.text ? newToast.text : type === 'error' ? t('general.error.text') : '',
      actions: newToast.actions || [],
      timed: newToast.timed ?? true,
      key: Date.now(),
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

    return toast.key
  }

  function success(toast: CreateToast): number {
    return add(toast, 'success')
  }

  function warn(toast: CreateToast): number {
    return add(toast, 'warn')
  }

  function error(toast: CreateToast = {}): number {
    return add(toast, 'error')
  }

  function info(toast: CreateToast): number {
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
})
