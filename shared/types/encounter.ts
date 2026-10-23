export type NewInitiativeRow = Partial<InitiativeSheetRow> & {
  name: string
  type: HomebrewType
}

export type EncounterCreature =
  | { monster: DndMonster }
  | { homebrew: HomebrewItemRow }
  | { row: NewInitiativeRow; roll?: number; initiativeModifier?: number }

export interface AddToEncounterOptions {
  amount?: number
  summoner?: string
}

export type EncounterRowEdit = Omit<NewInitiativeRow, 'summoner'> & {
  summoner?: string
}
