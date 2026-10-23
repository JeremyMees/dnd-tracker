import { describe, expect, it } from 'vitest'
import { toPlayerSheet, touchesPlayerView } from '~~/server/utils/player-portal'
import { storedBloodiedCondition } from '~~/test/fixtures/bloodied-condition'

const prone = { id: 'prone', name: 'Prone', desc: '' }
const conditions = [prone, storedBloodiedCondition]

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
    expect(result.settings).toEqual({ negative: false, bloodied: true })
    expect(result).toMatchObject({
      id: 1,
      title: 'Ambush',
      round: 2,
      activeIndex: 0,
    })
  })

  it("strips DM-only fields from a row and keeps real HP for the row's own seat", () => {
    const result = toPlayerSheet(sheet({ rows: [playerRow()] }), 'row-1')

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

  it('gives only the own row its max armor class', () => {
    const rows = [
      playerRow({ armorClass: 15, maxArmorClass: 18 }),
      playerRow({ id: 'row-2', armorClass: 12, maxArmorClass: 14 }),
    ]
    const result = toPlayerSheet(sheet({ rows }), 'row-1')

    expect(result.rows[0]!.maxArmorClass).toBe(18)
    expect(result.rows[1]!).not.toHaveProperty('maxArmorClass')
  })

  it('passes on the hp settings players need to predict their own changes', () => {
    const result = toPlayerSheet(
      sheet({
        settings: {
          spacing: 'normal',
          modified: false,
          negative: true,
          bloodied: false,
        },
      }),
    )

    expect(result.settings).toEqual({ negative: true, bloodied: false })
  })

  it('keeps real HP and death saves for a non-player row with no owning seat', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [playerRow({ type: 'npc', deathSaves: resetDeathSaves() })],
      }),
    )

    expect(result.rows[0]!).toMatchObject({ hitPoints: 20, maxHitPoints: 30 })
    expect(result.rows[0]!).toHaveProperty('deathSaves')
    expect(result.rows[0]!).not.toHaveProperty('healthBand')
  })

  it('hides real HP and death saves behind a health band for a player row viewed by someone else', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [playerRow({ deathSaves: resetDeathSaves() })],
      }),
    )

    expect(result.rows[0]!).not.toHaveProperty('hitPoints')
    expect(result.rows[0]!).not.toHaveProperty('maxHitPoints')
    expect(result.rows[0]!).not.toHaveProperty('tempHitPoints')
    expect(result.rows[0]!).not.toHaveProperty('deathSaves')
    expect(result.rows[0]!.healthBand).toBe('healthy')
  })

  it('keeps real HP and death saves for a player row when it belongs to the viewer', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [playerRow({ deathSaves: resetDeathSaves() })],
      }),
      'row-1',
    )

    expect(result.rows[0]!).toMatchObject({ hitPoints: 20, maxHitPoints: 30 })
    expect(result.rows[0]!).toHaveProperty('deathSaves')
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

  it.each([
    ['a player row viewed by someone else', playerRow({ conditions })],
    ['a monster shown as a health band', monsterRow({ conditions })],
  ])('hides bloodied on %s, next to its health band', (_, row) => {
    const result = toPlayerSheet(sheet({ rows: [row] }))

    expect(result.rows[0]!.healthBand).toBeDefined()
    expect(result.rows[0]!.conditions).toEqual([prone])
  })

  it('hides bloodied on a monster whose health is hidden', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [monsterRow({ conditions })],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterHealth: true },
        },
      }),
    )

    expect(result.rows[0]!.conditions).toEqual([prone])
  })

  it('keeps bloodied on rows that show their real hit points', () => {
    const own = toPlayerSheet(
      sheet({ rows: [playerRow({ conditions })] }),
      'row-1',
    )
    const npc = toPlayerSheet(
      sheet({ rows: [playerRow({ type: 'npc', conditions })] }),
    )

    expect(own.rows[0]!.conditions).toEqual(conditions)
    expect(npc.rows[0]!.conditions).toEqual(conditions)
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

  it('shows a used reaction on a player row', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [
          playerRow({ resources: { reaction: true, legendaryResistances: 1 } }),
        ],
      }),
    )

    expect(result.rows[0]!.reaction).toBe(true)
    expect(result.rows[0]!).not.toHaveProperty('resources')
  })

  it('shows a readied action on a player row', () => {
    const result = toPlayerSheet(
      sheet({ rows: [playerRow({ readied: true })] }),
    )

    expect(result.rows[0]!.readied).toBe(true)
  })

  it('hides the readied action of a monster row', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ readied: true })] }),
    )

    expect(result.rows[0]!).not.toHaveProperty('readied')
  })

  it('hides the reaction of a monster row', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ resources: { reaction: true } })] }),
    )

    expect(result.rows[0]!).not.toHaveProperty('reaction')
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

  it('replaces a hidden row with an unknown placeholder', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [
          playerRow({ id: 'row-1' }),
          monsterRow({
            id: 'row-2',
            index: 1,
            type: 'npc',
            hidden: true,
            concentration: true,
            conditions: [prone],
          }),
        ],
      }),
    )

    expect(result.rows[1]).toEqual({
      id: 'row-2',
      index: 1,
      initiative: -1,
      name: '???',
      type: 'monster',
      conditions: [],
      hidden: true,
    })
  })

  it('keeps visible rows free of the hidden flag', () => {
    const result = toPlayerSheet(
      sheet({ rows: [monsterRow({ hidden: false })] }),
    )

    expect(result.rows[0]).not.toHaveProperty('hidden')
  })

  it('keeps the active index on a hidden row taking its turn', () => {
    const result = toPlayerSheet(
      sheet({
        activeIndex: 1,
        rows: [playerRow(), monsterRow({ hidden: true })],
      }),
    )

    expect(result.activeIndex).toBe(1)
    expect(result.rows[1]!.name).toBe('???')
  })

  it('skips hidden monsters when numbering hidden monster names', () => {
    const result = toPlayerSheet(
      sheet({
        rows: [
          monsterRow({ id: 'row-1', hidden: true }),
          monsterRow({ id: 'row-2' }),
        ],
        settings: {
          spacing: 'normal',
          modified: false,
          live: { hideMonsterNames: true },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.rows.map(row => row.name)).toEqual(['???', 'Monster 1'])
  })

  it('defaults every action to allowed when settings.live.allow is unset', () => {
    const result = toPlayerSheet(sheet())

    expect(result.allow).toEqual({
      hp: true,
      ac: true,
      deathSaves: true,
      concentration: true,
      conditions: true,
      reaction: true,
      ready: true,
      endTurn: true,
    })
  })

  it('resolves settings.live.allow overrides per action, defaulting the rest to allowed', () => {
    const result = toPlayerSheet(
      sheet({
        settings: {
          spacing: 'normal',
          modified: false,
          live: { allow: { hp: false, conditions: false } },
        } as unknown as InitiativeSettings,
      }),
    )

    expect(result.allow).toEqual({
      hp: false,
      ac: true,
      deathSaves: true,
      concentration: true,
      conditions: false,
      reaction: true,
      ready: true,
      endTurn: true,
    })
  })
})

describe('touchesPlayerView', () => {
  it('is false for a DM-only note change', () => {
    expect(touchesPlayerView({ note: 'Flanking' })).toBe(false)
  })

  it.each([
    [{ hitPoints: 3 }],
    [{ name: 'Renamed' }],
    [{ note: 'Flanking', conditions: [] }],
  ])('is true for %o', patch => {
    expect(touchesPlayerView(patch)).toBe(true)
  })
})
