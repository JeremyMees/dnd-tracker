export type ConfirmCallback = (confirmed: boolean) => unknown

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
