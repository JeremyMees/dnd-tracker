export type CombatStatsEvent = Pick<
  CombatEventRow,
  'rowId' | 'round' | 'type' | 'payload'
>

export type CombatStatsRow = Pick<InitiativeSheetRow, 'id' | 'name' | 'type'>

export type CombatAward =
  | 'died'
  | 'mostDamageTaken'
  | 'mostTimesDowned'
  | 'biggestHit'
  | 'mostDeathSavesFailed'
  | 'mostHealingReceived'
  | 'mostDeathSavesMade'
  | 'mostConditions'
  | 'mostConcentrationBroken'
  | 'mostTempHitPoints'
  | 'unscathed'

export interface CombatantStats {
  rowId: string
  name: string
  type: HomebrewType
  damageTaken: number
  healingReceived: number
  tempHitPointsGained: number
  biggestHit: number
  timesDowned: number
  deathSavesMade: number
  deathSavesFailed: number
  conditionsSuffered: number
  concentrationBroken: number
  stabilized: number
  died: boolean
  award: CombatAward
  awardValue: number
  awardExclusive: boolean
}

export interface CombatStats {
  rounds: number
  events: number
  damageTaken: number
  healingReceived: number
  timesDowned: number
  deaths: number
  deathSavesMade: number
  deathSavesFailed: number
  conditionsApplied: number
  concentrationBroken: number
  combatants: CombatantStats[]
}
