export type Color =
  | 'primary'
  | 'tertiary'
  | 'success'
  | 'info'
  | 'warning'
  | 'help'
  | 'danger'
  | 'black'

export type Position = 'top' | 'right' | 'bottom' | 'left'

export interface EditorToolbarButton {
  id: string
  icon: string
  label: string
  run: () => void
  active?: boolean
  disabled?: boolean
}
