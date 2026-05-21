export function indexCorrect(rows: InitiativeSheetRow[]): InitiativeSheetRow[] {
  const sortedObjects = [...rows]

  // Sort the array based on the initiative value in descending order
  sortedObjects.sort((a, b) => {
    if (!a.initiative && !b.initiative) return 0
    if (!a.initiative) return 1
    if (!b.initiative) return -1
    return b.initiative - a.initiative
  })

  return sortedObjects.map((obj, index) => ({ ...obj, index }))
}

export function getCurrentRowIndex(sheet: InitiativeSheet, id: string): number {
  return sheet.rows.findIndex(row => row.id === id)
}

export const createInitiativeRow = (
  formData: Partial<InitiativeSheetRow> & { name: string },
  type: HomebrewType,
  encounterRows: number,
): InitiativeSheetRow => {
  const initiative = 'initiative' in formData ? Number(formData.initiative ?? -1) : -1
  const initiativeModifier = 'initiativeModifier' in formData ? Number(formData.initiativeModifier) : undefined
  const hp = getHP(formData)
  const ac = getAC(formData)
  const baseArray: [boolean, boolean, boolean] = [false, false, false]

  return {
    ...formData,
    id: crypto.randomUUID(),
    index: encounterRows + 1,
    conditions: [],
    type,
    initiative,
    initiativeModifier,
    note: '',
    hitPoints: hp,
    armorClass: ac,
    maxHitPoints: hp,
    maxArmorClass: ac,
    tempHitPoints: 0,
    tempArmorClass: 0,
    concentration: false,
    deathSaves: { save: baseArray, fail: baseArray },
  }
}
