export interface ConfirmConfig {
  title?: string
  description?: string
  confirmText?: string
  declineText?: string
}

export interface PopulatedConfirmConfig extends Required<ConfirmConfig> {
  uuid: string
  loading: boolean
  closing: boolean
  callback: ConfirmCallback
}

const CLOSE_ANIMATION_DURATION = 200

export function useConfirmDialogs() {
  const dialogs = useState<PopulatedConfirmConfig[]>('confirmDialogs', () => [])

  function closeDialog(uuid: string): void {
    const dialog = dialogs.value.find(dialog => dialog.uuid === uuid)

    if (dialog) {
      dialog.closing = true

      setTimeout(() => {
        dialogs.value = dialogs.value.filter(dialog => dialog.uuid !== uuid)
      }, CLOSE_ANIMATION_DURATION)
    }
  }

  const handlers = {
    confirm: async (uuid: string) => {
      const foundIndex = dialogs.value.findIndex(dialog => dialog.uuid === uuid)
      if (foundIndex !== -1 && dialogs.value[foundIndex]) {
        try {
          dialogs.value[foundIndex].loading = true
          await dialogs.value[foundIndex].callback(true)

          closeDialog(uuid)
        } catch {
          dialogs.value[foundIndex].loading = false
        }
      }
    },
    decline: async (uuid: string) => {
      const foundIndex = dialogs.value.findIndex(dialog => dialog.uuid === uuid)
      if (foundIndex !== -1 && dialogs.value[foundIndex]) {
        await dialogs.value[foundIndex].callback(false)

        closeDialog(uuid)
      }
    },
  }

  return {
    dialogs,
    handlers,
  }
}

export function useConfirm() {
  const { dialogs } = useConfirmDialogs()
  const { t } = useI18n()

  function ask(config: ConfirmConfig, callback: ConfirmCallback) {
    dialogs.value.push(
      Object.assign(
        {
          uuid: crypto.randomUUID(),
          callback,
          loading: false,
          closing: false,
          title: t('components.confirmationModal.title'),
          description: t('components.confirmationModal.text'),
          confirmText: t('actions.continue'),
          declineText: t('actions.cancel'),
        },
        config,
      ),
    )
  }

  return {
    ask,
  }
}
