import { afterEach, describe, expect, it, vi } from 'vitest'
import { bloodiedCondition } from '~~/test/fixtures/bloodied-condition'
import { mockHomebrewItem, mockHomebrewSummon } from '~~/test/fixtures/homebrew'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'

const noAutoRoll: InitiativeSettings = {
  spacing: 'normal',
  modified: true,
  autoRollInitiative: false,
}

const existing = [
  {
    id: 'aragorn',
    name: 'Aragorn',
    type: 'player',
    initiative: 12,
    index: 0,
    conditions: [],
  },
  {
    id: 'boromir',
    name: 'Boromir',
    type: 'npc',
    initiative: 5,
    index: 1,
    conditions: [],
  },
] as InitiativeSheetRow[]

const sheet = { rows: existing, settings: noAutoRoll }

function added(rows: InitiativeSheetRow[]): InitiativeSheetRow[] {
  return rows.filter(row => !existing.some(({ id }) => id === row.id))
}

describe('dnd/encounter', () => {
  describe('addToEncounter', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('adds a monster from the bestiary', () => {
      const [monster] = added(
        addToEncounter(sheet, [{ monster: dndMonsterFixture }]),
      )

      expect(monster).toMatchObject({
        name: dndMonsterFixture.name,
        type: 'monster',
        initiativeModifier: dndMonsterFixture.initiativeBonus,
      })
    })

    it('rolls the initiative of a monster when the setting is on', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5)

      const [monster] = added(
        addToEncounter(
          {
            rows: existing,
            settings: { ...noAutoRoll, autoRollInitiative: true },
          },
          [{ row: { name: 'Goblin', type: 'monster' }, initiativeModifier: 2 }],
        ),
      )

      expect(monster!.initiative).toBe(13)
    })

    it('links a campaign homebrew to the row', () => {
      const [row] = added(
        addToEncounter(sheet, [{ homebrew: mockHomebrewItem }]),
      )

      expect(row).toMatchObject({
        name: mockHomebrewItem.name,
        homebrew: mockHomebrewItem.id,
      })
    })

    it('adds a typed roll and the modifier as the initiative', () => {
      const [row] = added(
        addToEncounter(sheet, [
          {
            row: { name: 'Grommash', type: 'npc' },
            roll: 15,
            initiativeModifier: 3,
          },
        ]),
      )

      expect(row).toMatchObject({ initiative: 18, initiativeModifier: 3 })
    })

    it('keeps the default initiative without a typed roll', () => {
      const [row] = added(
        addToEncounter(sheet, [{ row: { name: 'Grommash', type: 'npc' } }]),
      )

      expect(row!.initiative).toBe(-1)
      expect(row!.initiativeModifier).toBeUndefined()
    })

    it('places the new rows by initiative and reindexes them', () => {
      const rows = addToEncounter(sheet, [
        { row: { name: 'Goblin', type: 'monster' }, roll: 8 },
      ])

      expect(rows.map(row => row.name)).toEqual([
        'Aragorn',
        'Goblin',
        'Boromir',
      ])
      expect(rows.map(row => row.index)).toEqual([0, 1, 2])
    })

    it('adds the given amount of copies with their own id', () => {
      const rows = added(
        addToEncounter(sheet, [{ row: { name: 'Goblin', type: 'monster' } }], {
          amount: 3,
        }),
      )

      expect(rows.map(row => row.name)).toEqual(['Goblin', 'Goblin', 'Goblin'])
      expect(new Set(rows.map(row => row.id)).size).toBe(3)
    })

    it('links a summon to its summoner', () => {
      const [summon] = added(
        addToEncounter(sheet, [{ homebrew: mockHomebrewSummon }], {
          summoner: 'aragorn',
        }),
      )

      expect(summon!.summoner).toEqual({ name: 'Aragorn', id: 'aragorn' })
    })

    it('only links summons to the summoner', () => {
      const rows = added(
        addToEncounter(
          sheet,
          [{ homebrew: mockHomebrewItem }, { homebrew: mockHomebrewSummon }],
          { summoner: 'aragorn' },
        ),
      )

      expect(rows.find(row => row.type !== 'summon')!.summoner).toBeUndefined()
      expect(rows.find(row => row.type === 'summon')!.summoner).toBeDefined()
    })

    it('does not link a summoner that is not in the encounter', () => {
      const [summon] = added(
        addToEncounter(sheet, [{ homebrew: mockHomebrewSummon }], {
          summoner: 'missing',
        }),
      )

      expect(summon!.summoner).toBeUndefined()
    })

    it('leaves the encounter rows untouched', () => {
      const rows = [...existing]

      addToEncounter({ rows, settings: noAutoRoll }, [
        { monster: dndMonsterFixture },
      ])

      expect(rows).toEqual(existing)
    })
  })

  describe('editEncounterRow', () => {
    const goblin: InitiativeSheetRow = {
      id: 'goblin',
      name: 'Goblin',
      type: 'monster',
      index: 2,
      initiative: 9,
      homebrew: 7,
      conditions: [],
      hitPoints: 4,
      maxHitPoints: 10,
      armorClass: 13,
      maxArmorClass: 13,
    }
    const rows = [...existing, goblin]

    function edited(result: InitiativeSheetRow[]): InitiativeSheetRow {
      return result.find(row => row.id === goblin.id)!
    }

    it('updates the row in place and keeps its combat state', () => {
      const result = editEncounterRow({ rows }, goblin, {
        name: 'Goblin boss',
        type: 'monster',
        hitPoints: 10,
        armorClass: 13,
      })

      expect(result.map(row => row.id)).toEqual(rows.map(row => row.id))
      expect(edited(result)).toMatchObject({
        name: 'Goblin boss',
        index: 2,
        initiative: 9,
        homebrew: 7,
        hitPoints: 4,
        maxHitPoints: 10,
      })
    })

    it('resets the current hit points when the base changes', () => {
      const result = editEncounterRow({ rows }, goblin, {
        name: 'Goblin',
        type: 'monster',
        hitPoints: 30,
        armorClass: 13,
      })

      expect(edited(result)).toMatchObject({ hitPoints: 30, maxHitPoints: 30 })
    })

    it('links the row to its summoner', () => {
      const result = editEncounterRow({ rows }, goblin, {
        name: 'Goblin',
        type: 'summon',
        summoner: 'boromir',
      })

      expect(edited(result).summoner).toEqual({
        name: 'Boromir',
        id: 'boromir',
      })
    })

    it('adds bloodied when the edited row is at half its hit points', () => {
      const result = editEncounterRow(
        { rows },
        goblin,
        { name: 'Goblin', type: 'monster', hitPoints: 10, armorClass: 13 },
        bloodiedCondition,
      )

      expect(edited(result).conditions.map(({ id }) => id)).toEqual([
        'bloodied',
      ])
    })

    it('drops bloodied when a new base resets the row to full hit points', () => {
      const bloodied = { ...goblin, conditions: [bloodiedCondition] }

      const result = editEncounterRow(
        { rows: [...existing, bloodied] },
        bloodied,
        { name: 'Goblin', type: 'monster', hitPoints: 30, armorClass: 13 },
        bloodiedCondition,
      )

      expect(edited(result).conditions).toEqual([])
    })
  })
})
