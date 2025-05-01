export interface ConfirmConfig {
  title?: string
  description?: string
  confirmText?: string
  declineText?: string
}

export interface PopulatedConfirmConfig extends Required<ConfirmConfig> {
  uuid: string
  loading: boolean
  callback: (confirmed: boolean) => any
}

export function useConfirmDialogs() {
  const dialogs = useState<PopulatedConfirmConfig[]>('confirmDialogs', () => ([]))

  const handlers = {
    confirm: async (uuid: string) => {
      const foundIndex = dialogs.value.findIndex(dialog => dialog.uuid === uuid)
      if (foundIndex !== -1 && dialogs.value[foundIndex]) {
        try {
          dialogs.value[foundIndex].loading = true
          await dialogs.value[foundIndex].callback(true)

          dialogs.value.splice(foundIndex, 1)
        }
        catch (error) {
          dialogs.value[foundIndex].loading = false
        }
      }
    },
    decline: async (uuid: string) => {
      const foundIndex = dialogs.value.findIndex(dialog => dialog.uuid === uuid)
      if (foundIndex !== -1 && dialogs.value[foundIndex]) {
        await dialogs.value[foundIndex].callback(false)

        dialogs.value.splice(foundIndex, 1)
      }
    },
  }

  return {
    dialogs,
    handlers,
  }
}

export function useConfirm() {
  const { t } = useI18n()
  const { dialogs } = useConfirmDialogs()

  function ask(config: ConfirmConfig, callback: (confirmed: boolean) => any) {
    dialogs.value.push(
      Object.assign(
        {
          uuid: crypto.randomUUID(),
          callback,
          loading: false,
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
