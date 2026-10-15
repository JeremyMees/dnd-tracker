export type ToastVariant =
  'default' | 'destructive' | 'info' | 'success' | 'warning'

export interface ToastItem {
  title: [string, Record<string, unknown>?]
  description: [string, Record<string, unknown>?]
  variant?: ToastVariant
}
