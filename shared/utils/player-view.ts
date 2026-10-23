function toPlayerRow(
  row: InitiativeSheetRow,
  monsterOrdinal: number,
  hideMonsterNames: boolean,
  hideMonsterHealth: boolean,
  hideMonsterAc: boolean,
  isOwnRow: boolean,
): PlayerRow {
  const isMonster = row.type === 'monster'
  const hidePlayerHealth = row.type === 'player' && !isOwnRow
  const hideHitPoints = isMonster || hidePlayerHealth

  const playerRow: PlayerRow = {
    id: row.id,
    index: row.index,
    initiative: row.initiative,
    name:
      isMonster && hideMonsterNames ? `Monster ${monsterOrdinal}` : row.name,
    type: row.type,
    conditions: hideHitPoints
      ? withoutBloodied(row.conditions)
      : row.conditions,
    concentration: row.concentration,
    player: row.player,
  }

  if (!hidePlayerHealth) playerRow.deathSaves = row.deathSaves

  if (!isMonster && row.resources?.reaction) playerRow.reaction = true

  if (!isMonster && row.readied) playerRow.readied = true

  if (!isMonster || !hideMonsterAc) {
    playerRow.armorClass = row.armorClass
    playerRow.tempArmorClass = row.tempArmorClass
  }

  if (isOwnRow) playerRow.maxArmorClass = row.maxArmorClass

  if (hidePlayerHealth) {
    playerRow.healthBand = getHealthBand(row.hitPoints, row.maxHitPoints)
  } else if (!isMonster) {
    playerRow.hitPoints = row.hitPoints
    playerRow.maxHitPoints = row.maxHitPoints
    playerRow.tempHitPoints = row.tempHitPoints
  } else if (!hideMonsterHealth) {
    playerRow.healthBand = getHealthBand(row.hitPoints, row.maxHitPoints)
  }

  return playerRow
}

function toHiddenPlayerRow(row: InitiativeSheetRow): PlayerRow {
  return {
    id: row.id,
    index: row.index,
    initiative: -1,
    name: '???',
    type: 'monster',
    conditions: [],
    hidden: true,
  }
}

type ViewedSheet = Pick<
  InitiativeSheet,
  'id' | 'title' | 'round' | 'activeIndex' | 'rows' | 'settings'
>

function toPlayerRows(
  sheet: Pick<InitiativeSheet, 'rows' | 'settings'>,
  isOwnRow: (row: InitiativeSheetRow) => boolean,
): PlayerRow[] {
  const hideMonsterNames = sheet.settings.live?.hideMonsterNames ?? false
  const hideMonsterHealth = sheet.settings.live?.hideMonsterHealth ?? false
  const hideMonsterAc = sheet.settings.live?.hideMonsterAc ?? false

  let monsterOrdinal = 0

  return sheet.rows.map(row => {
    if (row.hidden) return toHiddenPlayerRow(row)

    if (row.type === 'monster') monsterOrdinal += 1

    return toPlayerRow(
      row,
      monsterOrdinal,
      hideMonsterNames,
      hideMonsterHealth,
      hideMonsterAc,
      isOwnRow(row),
    )
  })
}

export function toPlayerSheet(
  sheet: ViewedSheet,
  ownRowId?: string,
): PlayerSheet {
  const allow = sheet.settings.live?.allow

  return {
    id: sheet.id,
    title: sheet.title,
    round: sheet.round,
    activeIndex: sheet.activeIndex,
    rows: toPlayerRows(sheet, row => row.id === ownRowId),
    allow: {
      hp: allow?.hp ?? true,
      ac: allow?.ac ?? true,
      deathSaves: allow?.deathSaves ?? true,
      concentration: allow?.concentration ?? true,
      conditions: allow?.conditions ?? true,
      reaction: allow?.reaction ?? true,
      ready: allow?.ready ?? true,
      endTurn: allow?.endTurn ?? true,
    },
    settings: {
      negative: sheet.settings.negative ?? false,
      bloodied: isBloodiedEnabled(sheet.settings),
    },
  }
}

export function changedPlayerRows(
  before: Pick<InitiativeSheet, 'rows' | 'settings'>,
  after: Pick<InitiativeSheet, 'rows' | 'settings'>,
): PlayerRow[] {
  const ownViews = new Map(
    toPlayerRows(before, () => true).map(row => [row.id, JSON.stringify(row)]),
  )
  const others = toPlayerRows(after, () => false)

  return toPlayerRows(after, () => true).flatMap((row, index) =>
    ownViews.get(row.id) === JSON.stringify(row) ? [] : [others[index]!],
  )
}
