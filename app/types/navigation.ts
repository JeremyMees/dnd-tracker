import type { RouteMapI18n } from 'vue-router'

export interface Route {
  label: string
  url: keyof RouteMapI18n
  requireAuth: boolean
  icon?: string
}

export interface Tab {
  link: string
  label: string
  icon: string
  disabled?: boolean
}
