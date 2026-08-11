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

  const playerRow: PlayerRow = {
    id: row.id,
    index: row.index,
    initiative: row.initiative,
    name:
      isMonster && hideMonsterNames ? `Monster ${monsterOrdinal}` : row.name,
    type: row.type,
    conditions: row.conditions,
    concentration: row.concentration,
    player: row.player,
  }

  if (!hidePlayerHealth) playerRow.deathSaves = row.deathSaves

  if (!isMonster || !hideMonsterAc) {
    playerRow.armorClass = row.armorClass
    playerRow.tempArmorClass = row.tempArmorClass
  }

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

export function toPlayerSheet(
  sheet: Pick<
    InitiativeSheet,
    'id' | 'title' | 'round' | 'activeIndex' | 'rows' | 'settings'
  >,
  ownRowId?: string,
): PlayerSheet {
  const hideMonsterNames = sheet.settings.live?.hideMonsterNames ?? false
  const hideMonsterHealth = sheet.settings.live?.hideMonsterHealth ?? false
  const hideMonsterAc = sheet.settings.live?.hideMonsterAc ?? false
  const allow = sheet.settings.live?.allow

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
        hideMonsterAc,
        row.id === ownRowId,
      )
    }),
    allow: {
      hp: allow?.hp ?? true,
      ac: allow?.ac ?? true,
      deathSaves: allow?.deathSaves ?? true,
      concentration: allow?.concentration ?? true,
      conditions: allow?.conditions ?? true,
    },
  }
}

export async function resolveOwnRowId(
  seatToken: unknown,
  session: LiveSessionTokenPayload,
  seats: LiveSeat[],
): Promise<string | undefined> {
  if (!seatToken || typeof seatToken !== 'string') return undefined

  try {
    const payload = await verifyLiveSeatToken(seatToken)

    if (
      payload.session !== session.session ||
      payload.encounter !== session.encounter
    ) {
      return undefined
    }

    return seats.find(s => s.seat === payload.seat)?.row ?? undefined
  } catch {
    return undefined
  }
}
