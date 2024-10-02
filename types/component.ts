export type ToastType = 'error' | 'warn' | 'info' | 'success'

export interface Toast {
  key: number
  timeout: number
  title: string
  text: string
  actions: any[]
  timed: boolean
  type: ToastType
}

export type CreateToast = Partial<Omit<Toast, 'key' | 'type'>>
