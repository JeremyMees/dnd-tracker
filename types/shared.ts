export type Dice = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'

export type Color = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'black'

export interface Option<T> {
  label: string
  value: T | number | string
}

export interface Route {
  label: string
  url: string
  requireAuth: boolean
}
