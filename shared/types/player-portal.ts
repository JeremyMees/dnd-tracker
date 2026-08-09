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
  tempArmorClass?: number
  player?: string
  hitPoints?: number
  maxHitPoints?: number
  tempHitPoints?: number
  healthBand?: DndHealthBand
}

export interface PlayerSheet {
  id: number
  title: string
  round: number
  activeIndex: number
  rows: PlayerRow[]
}
