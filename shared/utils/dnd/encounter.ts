function creatureToRow(creature: EncounterCreature): NewInitiativeRow {
  if ('monster' in creature) return monsterToRow(creature.monster)
  if ('homebrew' in creature) return homebrewToRow(creature.homebrew)

  const { row, roll, initiativeModifier } = creature

  return {
    ...row,
    ...(roll ? { initiative: roll + (initiativeModifier ?? 0) } : {}),
    ...(isDefined(initiativeModifier) ? { initiativeModifier } : {}),
  }
}

export function addToEncounter(
  sheet: Pick<InitiativeSheet, 'rows' | 'settings'>,
  creatures: EncounterCreature[],
  { amount = 1, summoner }: AddToEncounterOptions = {},
): InitiativeSheetRow[] {
  const linked = toSummoner(sheet.rows, summoner)
  const added = creatures.flatMap(creature => {
    const row = creatureToRow(creature)
    const placed =
      row.type === 'summon' && linked ? { ...row, summoner: linked } : row

    return Array.from({ length: amount }, () => placed)
  })

  return appendRows(sheet.rows, added, sheet.settings)
}

export function editEncounterRow(
  sheet: Pick<InitiativeSheet, 'rows'>,
  row: InitiativeSheetRow,
  { summoner, ...edit }: EncounterRowEdit,
  bloodied?: DndCondition,
): InitiativeSheetRow[] {
  const edited = editInitiativeRow(
    row,
    { ...edit, summoner: toSummoner(sheet.rows, summoner) },
    edit.type,
  )

  return replaceRow(sheet.rows, withBloodied(edited, bloodied))
}
