export interface PlayerRow {
  id: string
  index: number
  initiative: number
  name: string
  type: HomebrewType
  conditions: DndCondition[]
  deathSaves?: DndDeathSaves
  concentration?: boolean
  armorClass?: number
  maxArmorClass?: number
  tempArmorClass?: number
  player?: string
  hitPoints?: number
  maxHitPoints?: number
  tempHitPoints?: number
  healthBand?: DndHealthBand
  reaction?: boolean
  readied?: boolean
  hidden?: boolean
}

export interface PlayerSheet {
  id: number
  title: string
  round: number
  activeIndex: number
  rows: PlayerRow[]
  allow: LiveAllowActions
  settings: PlayerSheetSettings
}

export type PlayerSheetSettings = Pick<
  InitiativeSettings,
  'negative' | 'bloodied'
>

export interface LiveCodeSession {
  code: string
  expiresAt: string
  rows: Pick<PlayerRow, 'id' | 'name' | 'type'>[]
}

export interface LiveStateResponse {
  sheet: PlayerSheet
  session: {
    code: string
    expiresAt: string
    version: number
    kicked: boolean
    row?: string
  }
}
