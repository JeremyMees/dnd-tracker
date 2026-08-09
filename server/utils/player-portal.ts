function toPlayerRow(
  row: InitiativeSheetRow,
  monsterOrdinal: number,
  hideMonsterNames: boolean,
  hideMonsterHealth: boolean,
): PlayerRow {
  const isMonster = row.type === 'monster'

  const playerRow: PlayerRow = {
    id: row.id,
    index: row.index,
    initiative: row.initiative,
    name:
      isMonster && hideMonsterNames ? `Monster ${monsterOrdinal}` : row.name,
    type: row.type,
    conditions: row.conditions,
    deathSaves: row.deathSaves,
    concentration: row.concentration,
    armorClass: row.armorClass,
    tempArmorClass: row.tempArmorClass,
    player: row.player,
  }

  if (!isMonster) {
    playerRow.hitPoints = row.hitPoints
    playerRow.maxHitPoints = row.maxHitPoints
    playerRow.tempHitPoints = row.tempHitPoints
  } else if (!hideMonsterHealth) {
    playerRow.healthBand = getHealthBand(row.hitPoints, row.maxHitPoints)
  }

  return playerRow
}

export function toPlayerSheet(sheet: InitiativeSheet): PlayerSheet {
  const hideMonsterNames = sheet.settings.live?.hideMonsterNames ?? false
  const hideMonsterHealth = sheet.settings.live?.hideMonsterHealth ?? false

  let monsterOrdinal = 0

  return {
    id: sheet.id,
    title: sheet.title,
    round: sheet.round,
    activeIndex: sheet.activeIndex,
    rows: sheet.rows.map(row => {
      if (row.type === 'monster') monsterOrdinal += 1

      return toPlayerRow(
        row,
        monsterOrdinal,
        hideMonsterNames,
        hideMonsterHealth,
      )
    }),
  }
}
