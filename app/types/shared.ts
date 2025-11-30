export type Dice = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'
export type DiceSide = 4 | 6 | 8 | 10 | 12 | 20 | 100

export type Color = 'primary' | 'tertiary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'black'

export type Position = 'top' | 'right' | 'bottom' | 'left'

export interface Option<T> {
  label: string
  value: T
}

export interface Route {
  label: string
  url: string
  requireAuth: boolean
  icon?: string
}

export type HealthType = 'heal' | 'damage' | 'temp' | 'override' | 'override-reset'
export type AcType = 'add' | 'remove' | 'temp' | 'override' | 'override-reset'
