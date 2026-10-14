export type ToastVariant =
  | 'default'
  | 'destructive'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'info'
  | 'success'
  | 'warning'
  | 'help'

export interface ToastItem {
  title: [string, Record<string, unknown>?]
  description: [string, Record<string, unknown>?]
  variant?: ToastVariant
}
