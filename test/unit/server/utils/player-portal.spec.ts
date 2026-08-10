import { describe, expect, it } from 'vitest'
import { toPlayerSheet } from '~~/server/utils/player-portal'

function playerRow(overrides: Partial<InitiativeSheetRow> = {}) {
  return {
    id: 'row-1',
    index: 0,
    initiative: 15,
    name: 'Elara',
    type: 'player',
    conditions: [],
    hitPoints: 20,
    maxHitPoints: 30,
    armorClass: 16,
    tempArmorClass: 2,
    note: 'DM secret note',
    link: 'https://www.dndbeyond.com/characters/1',
    actions: [{ name: 'Fireball' }],
    abilityScores: { str: 10 },
    ...overrides,
  } as unknown as InitiativeSheetRow
}

function monsterRow(overrides: Partial<InitiativeSheetRow> = {}) {
  return playerRow({
    id: 'row-2',
    index: 1,
    name: 'Goblin',
    type: 'monster',
    hitPoints: 7,
    maxHitPoints: 7,
    ...overrides,
  })
}

function sheet(overrides: Partial<InitiativeSheet> = {}) {
  return {
    id: 1,
    title: 'Ambush',
    round: 2,
    activeIndex: 0,
    info: 'DM plot notes',
    infoCards: [{ id: 'srd-fireball' }],
    createdBy: 'dm-user-id',
    campaign: { id: 1, title: 'Campaign', createdBy: {}, team: [] },
    rows: [playerRow()],
    settings: { spacing: 'normal', modified: false },
    ...overrides,
  } as unknown as InitiativeSheet
}

describe('toPlayerSheet', () => {
  it('strips DM-only fields from the sheet', () => {
    const result = toPlayerSheet(sheet())

    expect(result).not.toHaveProperty('info')
    expect(result).not.toHaveProperty('infoCards')
    expect(result).not.toHaveProperty('campaign')
    expect(result).not.toHaveProperty('createdBy')
    expect(result).not.toHaveProperty('settings')
    expect(result).toMatchObject({
      id: 1,
      title: 'Ambush',
      round: 2,
      activeIndex: 0,
    })
  })

  it('strips DM-only fields from a row and keeps real HP for non-monsters', () => {
    const result = toPlayerSheet(sheet({ rows: [playerRow()] }))

    expect(result.rows[0]!).not.toHaveProperty('note')
    expect(result.rows[0]!).not.toHaveProperty('link')
    expect(result.rows[0]!).not.toHaveProperty('actions')
    expect(result.rows[0]!).not.toHaveProperty('abilityScores')
    expect(result.rows[0]!).toMatchObject({
      id: 'row-1',
      name: 'Elara',
      hitPoints: 20,
      maxHitPoints: 30,
    })
    expect(result.rows[0]!).not.toHaveProperty('healthBand')
  })

  it('shows a health band instead of numbers for monsters by default', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ hitPoints: 80, maxHitPoints: 100 })] }),
    )

    expect(result.rows[0]!).not.toHaveProperty('hitPoints')
    expect(result.rows[0]!).not.toHaveProperty('maxHitPoints')
    expect(result.rows[0]!).not.toHaveProperty('tempHitPoints')
    expect(result.rows[0]!.healthBand).toBe('healthy')
  })

  it('hides monster health entirely when hideMonsterHealth is set', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [monsterRow()],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterHealth: true },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.rows[0]!).not.toHaveProperty('hitPoints')
    expect(result.rows[0]!).not.toHaveProperty('healthBand')
  })

  it('keeps monster armor class by default', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ armorClass: 15, tempArmorClass: 3 })] }),
    )

    expect(result.rows[0]!.armorClass).toBe(15)
    expect(result.rows[0]!.tempArmorClass).toBe(3)
  })

  it('hides monster armor class entirely when hideMonsterAc is set', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [monsterRow()],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterAc: true },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.rows[0]!).not.toHaveProperty('armorClass')
    expect(result.rows[0]!).not.toHaveProperty('tempArmorClass')
  })

  it('keeps non-monster armor class even when hideMonsterAc is set', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [playerRow({ armorClass: 18 })],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterAc: true },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.rows[0]!.armorClass).toBe(18)
  })

  it('keeps monster names by default', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ name: 'Goblin' })] }),
    )

    expect(result.rows[0]!.name).toBe('Goblin')
  })

  it('replaces monster names with a sequential label when hideMonsterNames is set', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [
          playerRow({ id: 'row-1', name: 'Elara' }),
          monsterRow({ id: 'row-2', name: 'Goblin A' }),
          playerRow({ id: 'row-3', name: 'Zylkan', type: 'npc' }),
          monsterRow({ id: 'row-4', name: 'Goblin B' }),
        ],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterNames: true },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.rows.map(row => row.name)).toEqual([
      'Elara',
      'Monster 1',
      'Zylkan',
      'Monster 2',
    ])
  })
})
