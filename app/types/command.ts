export interface PaletteCommand {
  id: string
  label: string
  icon: string
  iconClass?: string
  keywords?: string[]
  shortcut?: string[]
  disabled?: boolean
  run: () => void
}

export type RowShortcutAction = 'damage' | 'heal' | 'condition'

export interface RowShortcutRequest {
  rowId: string
  action: RowShortcutAction
}

export interface ShortcutDescription {
  label: string
  keys: string[]
}
