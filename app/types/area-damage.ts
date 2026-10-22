export interface AreaDamageValues {
  amount: number
  damageType?: DndDamageType
  dc?: number
  ability: DndAbility
  halfOnSave: boolean
}

export interface AreaDamagePrefill {
  values: Partial<AreaDamageValues>
  source?: { rowId: string; action: string }
}
