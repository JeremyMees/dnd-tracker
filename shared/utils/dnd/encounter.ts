import { maxEncounterRows } from '~~/constants/dnd'

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

function encounterRoom(sheet: Pick<InitiativeSheet, 'rows'>): number {
  return Math.max(maxEncounterRows - sheet.rows.length, 0)
}

function encounterFullToast(room: number): ToastItem {
  return {
    title: ['components.initiativeTable.full.title'],
    description: [
      `components.initiativeTable.full.${room ? 'some' : 'none'}`,
      { max: maxEncounterRows, room },
    ],
    variant: 'warning',
  }
}

export function addToEncounter(
  sheet: Pick<InitiativeSheet, 'rows' | 'settings'>,
  creatures: EncounterCreature[],
  { amount = 1, summoner }: AddToEncounterOptions = {},
): AddToEncounterResult {
  const room = encounterRoom(sheet)

  if (creatures.length * amount > room) {
    return { full: true, room, toast: encounterFullToast(room) }
  }

  const linked = toSummoner(sheet.rows, summoner)
  const added = creatures.flatMap(creature => {
    const row = creatureToRow(creature)
    const placed =
      row.type === 'summon' && linked ? { ...row, summoner: linked } : row

    return Array.from({ length: amount }, () => placed)
  })

  return { full: false, rows: appendRows(sheet.rows, added, sheet.settings) }
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
