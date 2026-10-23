const dmOnlyRowFields = new Set(['note'])

export function touchesPlayerView(patch: object): boolean {
  return Object.keys(patch).some(key => !dmOnlyRowFields.has(key))
}

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
      if (row.hidden) return toHiddenPlayerRow(row)

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

export async function resolveOwnRowId(
  seatToken: unknown,
  session: LiveSessionTokenPayload,
  seats: LiveSeat[],
): Promise<OwnSeat> {
  if (!seatToken || typeof seatToken !== 'string') {
    return { row: undefined, kicked: false }
  }

  try {
    const payload = await verifyLiveSeatToken(seatToken)

    if (
      payload.session !== session.session ||
      payload.encounter !== session.encounter
    ) {
      return { row: undefined, kicked: false }
    }

    const seat = seats.find(s => s.seat === payload.seat)

    if (!seat) return { row: undefined, kicked: true }

    return { row: seat.row ?? undefined, kicked: false }
  } catch {
    return { row: undefined, kicked: false }
  }
}
