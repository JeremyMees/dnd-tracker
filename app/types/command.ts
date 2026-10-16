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
