import type { RouteMapI18n } from 'vue-router'

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

export interface Option<T> {
  label: string
  value: T
}

export interface Route {
  label: string
  url: keyof RouteMapI18n
  requireAuth: boolean
  icon?: string
}
