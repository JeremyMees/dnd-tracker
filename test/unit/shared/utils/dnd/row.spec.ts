import { describe, expect, it } from 'vitest'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { dndMonsterFixture } from '~~/test/fixtures/open5e'

describe('dnd/row', () => {
  describe('indexCorrect', () => {
    it('should sort rows by initiative and add index', () => {
      const rows = [
        { id: '1', initiative: 15 },
        { id: '2', initiative: 20 },
        { id: '3', initiative: 10 },
      ] as InitiativeSheetRow[]

      const result = indexCorrect(rows)

      expect(result[0]?.initiative).toBe(20)
      expect(result[0]?.index).toBe(0)
      expect(result[1]?.initiative).toBe(15)
      expect(result[1]?.index).toBe(1)
      expect(result[2]?.initiative).toBe(10)
      expect(result[2]?.index).toBe(2)
    })

    it('should sort a rolled 0 above unrolled rows', () => {
      const rows = [
        { id: 'unrolled', initiative: -1 },
        { id: 'missing' },
        { id: 'zero', initiative: 0 },
      ] as InitiativeSheetRow[]

      expect(indexCorrect(rows).map(row => row.id)).toEqual([
        'zero',
        'unrolled',
        'missing',
      ])
    })

    it('should keep the manual order of tied rows', () => {
      const rows = [
        { id: 'b', initiative: 12, initiativeModifier: 1 },
        { id: 'a', initiative: 12, initiativeModifier: 4 },
        { id: 'c', initiative: 18 },
      ] as InitiativeSheetRow[]

      expect(indexCorrect(rows).map(row => row.id)).toEqual(['c', 'b', 'a'])
    })
  })

  describe('placeByInitiative', () => {
    const rows = [
      { id: 'high', initiative: 18, type: 'monster' },
      { id: 'tie-low', initiative: 12, initiativeModifier: 1, type: 'monster' },
      { id: 'tie-mid', initiative: 12, initiativeModifier: 3, type: 'npc' },
      { id: 'low', initiative: 4, type: 'monster' },
    ] as InitiativeSheetRow[]

    it('should place a row above tied rows with a lower modifier', () => {
      const moved = {
        id: 'moved',
        initiative: 12,
        initiativeModifier: 2,
        type: 'monster',
      } as InitiativeSheetRow

      expect(
        placeByInitiative([...rows, moved], ['moved']).map(row => row.id),
      ).toEqual(['high', 'moved', 'tie-low', 'tie-mid', 'low'])
    })

    it('should place a row after tied rows with the same modifier', () => {
      const tied = [
        { id: 'tie-5', initiative: 12, initiativeModifier: 5, type: 'monster' },
        { id: 'tie-2', initiative: 12, initiativeModifier: 2, type: 'monster' },
        { id: 'low', initiative: 4, type: 'monster' },
      ] as InitiativeSheetRow[]
      const moved = {
        id: 'moved',
        initiative: 12,
        initiativeModifier: 2,
        type: 'monster',
      } as InitiativeSheetRow

      expect(
        placeByInitiative([moved, ...tied], ['moved']).map(row => row.id),
      ).toEqual(['tie-5', 'tie-2', 'moved', 'low'])
    })

    it('should place a player before a tied non-player with the same modifier', () => {
      const player = {
        id: 'player',
        initiative: 12,
        initiativeModifier: 1,
        type: 'player',
      } as InitiativeSheetRow

      expect(
        placeByInitiative([...rows, player], ['player']).map(row => row.id),
      ).toEqual(['high', 'player', 'tie-low', 'tie-mid', 'low'])
    })

    it('should keep the added order of rows without a rolled initiative', () => {
      const unrolled = [
        {
          id: 'goblin',
          initiative: -1,
          initiativeModifier: 1,
          type: 'monster',
        },
      ] as InitiativeSheetRow[]
      const player = {
        id: 'player',
        initiative: -1,
        initiativeModifier: 4,
        type: 'player',
      } as InitiativeSheetRow

      expect(
        placeByInitiative([...unrolled, player], ['player']).map(row => row.id),
      ).toEqual(['goblin', 'player'])
    })

    it('should leave the order of rows that are not placed untouched', () => {
      expect(placeByInitiative(rows, []).map(row => row.id)).toEqual([
        'high',
        'tie-low',
        'tie-mid',
        'low',
      ])
    })

    it('should place several rows at once', () => {
      const first = { id: 'first', initiative: 20 } as InitiativeSheetRow
      const last = { id: 'last', initiative: 1 } as InitiativeSheetRow

      expect(
        placeByInitiative([last, ...rows, first], ['last', 'first']).map(
          row => row.id,
        ),
      ).toEqual(['first', 'high', 'tie-low', 'tie-mid', 'low', 'last'])
    })
  })

  describe('sanitizeRowNumbers', () => {
    it('should coerce string integer fields to numbers', () => {
      const row = {
        id: '1',
        armorClass: '15',
        hitPoints: '20',
        tempArmorClass: '2',
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBe(15)
      expect(result.hitPoints).toBe(20)
      expect(result.tempArmorClass).toBe(2)
    })

    it('should round float values to integers', () => {
      const row = {
        id: '1',
        armorClass: 15.6,
        maxHitPoints: 20.2,
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBe(16)
      expect(result.maxHitPoints).toBe(20)
    })

    it('should turn invalid values into undefined', () => {
      const row = {
        id: '1',
        armorClass: '',
        hitPoints: 'abc',
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.armorClass).toBeUndefined()
      expect(result.hitPoints).toBeUndefined()
    })

    it('should leave non-numeric fields untouched', () => {
      const row = {
        id: '1',
        name: 'Goblin',
        armorClass: 15,
        conditions: [],
      } as unknown as InitiativeSheetRow

      const result = sanitizeRowNumbers(row)

      expect(result.name).toBe('Goblin')
      expect(result.id).toBe('1')
      expect(result.conditions).toEqual([])
    })
  })

  describe('sanitizeCondition', () => {
    it('drops null level and hasLevels', () => {
      expect(
        sanitizeCondition({
          id: 'prone',
          name: 'Prone',
          desc: 'On the ground.',
          level: null,
          hasLevels: null,
        }),
      ).toStrictEqual({ id: 'prone', name: 'Prone', desc: 'On the ground.' })
    })

    it('keeps a duration and drops its empty fields', () => {
      expect(
        sanitizeCondition({
          id: 'prone',
          name: 'Prone',
          desc: 'On the ground.',
          duration: {
            rowId: 'row-1',
            timing: 'start',
            rounds: '2' as unknown as number,
            save: null,
          },
        }),
      ).toStrictEqual({
        id: 'prone',
        name: 'Prone',
        desc: 'On the ground.',
        duration: { rowId: 'row-1', timing: 'start', rounds: 2 },
      })
    })

    it('keeps a duration save', () => {
      expect(
        sanitizeCondition({
          id: 'paralyzed',
          name: 'Paralyzed',
          desc: 'Cannot move.',
          duration: {
            rowId: 'row-1',
            timing: 'end',
            rounds: null,
            save: { ability: 'wisdom', dc: 14 },
          },
        }).duration,
      ).toStrictEqual({
        rowId: 'row-1',
        timing: 'end',
        save: { ability: 'wisdom', dc: 14 },
      })
    })

    it('drops a null duration', () => {
      expect(
        sanitizeCondition({
          id: 'prone',
          name: 'Prone',
          desc: 'On the ground.',
          duration: null,
        }),
      ).toStrictEqual({ id: 'prone', name: 'Prone', desc: 'On the ground.' })
    })

    it('keeps level and hasLevels when set', () => {
      expect(
        sanitizeCondition({
          id: 'exhaustion',
          name: 'Exhaustion',
          desc: 'Tired.',
          level: 3,
          hasLevels: true,
        }),
      ).toStrictEqual({
        id: 'exhaustion',
        name: 'Exhaustion',
        desc: 'Tired.',
        level: 3,
        hasLevels: true,
      })
    })

    it('rounds a fractional level to an integer', () => {
      expect(
        sanitizeCondition({
          id: 'exhaustion',
          name: 'Exhaustion',
          desc: '',
          level: 2.6,
        }).level,
      ).toBe(3)
    })

    it('strips keys that are not part of a stored condition', () => {
      const condition = {
        id: 'blinded',
        name: 'Blinded',
        desc: 'Cannot see.',
        documentKey: 'core',
      } as DndCondition

      expect(sanitizeCondition(condition)).toStrictEqual({
        id: 'blinded',
        name: 'Blinded',
        desc: 'Cannot see.',
      })
    })

    it('defaults a missing desc to an empty string', () => {
      const condition = { id: 'blinded', name: 'Blinded' } as DndCondition

      expect(sanitizeCondition(condition).desc).toBe('')
    })
  })

  describe('getCurrentRowIndex', () => {
    it('should return correct index for existing id', () => {
      const index = getCurrentRowIndex(sheet, sheet.rows[0]?.id ?? '')
      expect(index).toBe(0)
    })

    it('should return -1 for non-existent id', () => {
      const index = getCurrentRowIndex(sheet, 'non-existent-id')
      expect(index).toBe(-1)
    })
  })

  describe('createInitiativeRow', () => {
    it('should create row with expected base structure', () => {
      const formData = {
        name: 'Test',
        hitPoints: 20,
        armorClass: 15,
      }

      const row = createInitiativeRow(formData, 'monster', 0)

      expect(row).toHaveProperty('id')
      expect(row.hitPoints).toBe(20)
      expect(row.armorClass).toBe(15)
      expect(row.maxHitPoints).toBe(20)
      expect(row.maxArmorClass).toBe(15)
      expect(row.conditions).toEqual([])
      expect(row.deathSaves).toEqual({
        fail: [false, false, false],
        save: [false, false, false],
      })
    })

    it('should preserve extended homebrew fields from formData', () => {
      const abilityScores = {
        strength: 10,
        dexterity: 14,
        constitution: 12,
        intelligence: 8,
        wisdom: 10,
        charisma: 16,
      } as DndAbilityScores
      const traits = [
        { name: 'Brave', desc: 'Advantage on saves vs fear' },
      ] as DndTrait[]
      const formData = {
        name: 'Homebrew Monster',
        hitPoints: 30,
        armorClass: 13,
        abilityScores,
        traits,
        proficiencyBonus: 2,
        passivePerception: 12,
      }

      const row = createInitiativeRow(formData, 'monster', 0)

      expect(row.abilityScores).toEqual(abilityScores)
      expect(row.traits).toEqual(traits)
      expect(row.proficiencyBonus).toBe(2)
      expect(row.passivePerception).toBe(12)
    })
  })

  describe('appendRows', () => {
    const existing = [
      { id: 'a', name: 'Aragorn', initiative: 12, index: 0 },
      { id: 'b', name: 'Boromir', initiative: 5, index: 1 },
    ] as InitiativeSheetRow[]

    it('Should add a new row for every given row', () => {
      const result = appendRows(existing, [
        { name: 'Goblin', type: 'monster' },
        { name: 'Wolf', type: 'summon' },
      ])

      expect(result).toHaveLength(4)
      expect(result.find(r => r.name === 'Goblin')!.type).toBe('monster')
      expect(result.find(r => r.name === 'Wolf')!.type).toBe('summon')
    })

    it('Should sort the rows by initiative and reindex them', () => {
      const result = appendRows(existing, [
        { name: 'Goblin', type: 'monster', initiative: 20 },
      ])

      expect(result.map(r => r.name)).toEqual(['Goblin', 'Aragorn', 'Boromir'])
      expect(result.map(r => r.index)).toEqual([0, 1, 2])
    })

    it('Should place a new row above tied rows with a lower modifier', () => {
      const result = appendRows(existing, [
        {
          name: 'Goblin',
          type: 'monster',
          initiative: 12,
          initiativeModifier: 2,
        },
      ])

      expect(result.map(r => r.name)).toEqual(['Goblin', 'Aragorn', 'Boromir'])
    })

    it('Should give copies of the same row their own id', () => {
      const goblin = { name: 'Goblin', type: 'monster' as const }

      const result = appendRows([], [goblin, goblin, goblin])

      expect(new Set(result.map(r => r.id)).size).toBe(3)
    })

    it('Should leave the given rows untouched', () => {
      const rows = [...existing]

      appendRows(rows, [{ name: 'Goblin', type: 'monster' }])

      expect(rows).toEqual(existing)
    })
  })

  describe('monsterToRow', () => {
    it('should turn a bestiary monster into monster row data', () => {
      const row = monsterToRow(dndMonsterFixture)

      expect(row).toMatchObject({
        name: dndMonsterFixture.name,
        type: 'monster',
        hitPoints: dndMonsterFixture.hitPoints,
        armorClass: dndMonsterFixture.armorClass,
        hitDice: parseDndDiceToString(dndMonsterFixture.hitDice),
        languages: dndMonsterFixture.languages.map(language => language.name),
        initiativeModifier: dndMonsterFixture.initiativeBonus,
      })
    })

    it('should drop the monster fields a row has no place for', () => {
      const row = monsterToRow(dndMonsterFixture)

      for (const field of [
        'size',
        'challengeRating',
        'alignment',
        'experiencePoints',
        'initiativeBonus',
      ]) {
        expect(row).not.toHaveProperty(field)
      }
    })

    it('should leave out a missing proficiency bonus', () => {
      const row = monsterToRow({ ...dndMonsterFixture, proficiencyBonus: null })

      expect(row.proficiencyBonus).toBeUndefined()
    })
  })

  describe('homebrewToRow', () => {
    it('should link the row to the homebrew it came from', () => {
      const row = homebrewToRow(mockHomebrewItem)

      expect(row.homebrew).toBe(mockHomebrewItem.id)
      expect(row).not.toHaveProperty('id')
      expect(row).toMatchObject({
        name: mockHomebrewItem.name,
        type: mockHomebrewItem.type,
        campaign: mockHomebrewItem.campaign,
        hitPoints: mockHomebrewItem.hitPoints,
      })
    })

    it('should turn nulls into undefined', () => {
      const row = homebrewToRow(mockHomebrewItem)

      expect(row.player).toBeUndefined()
      expect(row.link).toBeUndefined()
      expect(row.traits).toBeUndefined()
    })

    it('should parse the stored initiative modifier', () => {
      expect(homebrewToRow(mockHomebrewItem).initiativeModifier).toBe(2)
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: '0' })
          .initiativeModifier,
      ).toBe(0)
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: '' })
          .initiativeModifier,
      ).toBeUndefined()
      expect(
        homebrewToRow({ ...mockHomebrewItem, initiativeModifier: null })
          .initiativeModifier,
      ).toBeUndefined()
    })
  })

  describe('toSummoner', () => {
    it('should return the name and id of the summoning row', () => {
      const summoner = sheet.rows[0]!

      expect(toSummoner(sheet.rows, summoner.id)).toEqual({
        name: summoner.name,
        id: summoner.id,
      })
    })

    it('should return undefined without a matching row', () => {
      expect(toSummoner(sheet.rows, 'missing')).toBeUndefined()
      expect(toSummoner(sheet.rows)).toBeUndefined()
    })
  })

  describe('replaceRow', () => {
    it('should swap in the row with the same id and keep the order', () => {
      const replacement = { ...sheet.rows[1]!, name: 'Renamed' }

      const rows = replaceRow(sheet.rows, replacement)

      expect(rows).toHaveLength(sheet.rows.length)
      expect(rows[1]).toBe(replacement)
      expect(rows[0]).toBe(sheet.rows[0])
    })

    it('should leave the rows alone when no id matches', () => {
      const rows = replaceRow(sheet.rows, { ...sheet.rows[0]!, id: 'missing' })

      expect(rows).toEqual(sheet.rows)
    })
  })

  describe('editInitiativeRow', () => {
    const row: InitiativeSheetRow = {
      id: 'row-1',
      index: 2,
      initiative: 14,
      name: 'Goblin',
      type: 'monster',
      homebrew: 7,
      note: 'flanking',
      conditions: [{ id: 'prone', name: 'Prone', desc: 'On the ground' }],
      concentration: true,
      deathSaves: { save: [true, false, false], fail: [false, false, false] },
      hitPoints: 4,
      maxHitPoints: 12,
      tempHitPoints: 3,
      armorClass: 15,
      maxArmorClass: 15,
      tempArmorClass: 2,
    }

    it('should apply the edited stats and keep the combat state', () => {
      const edited = editInitiativeRow(
        row,
        {
          name: 'Goblin Boss',
          link: 'https://example.com',
          hitPoints: 12,
          armorClass: 15,
        },
        'npc',
      )

      expect(edited).toEqual({
        ...row,
        name: 'Goblin Boss',
        link: 'https://example.com',
        type: 'npc',
      })
    })

    it('should reset current hit points when the base changes', () => {
      const edited = editInitiativeRow(
        { ...row, maxHitPoints: 30, maxHitPointsOld: 12 },
        { name: 'Goblin', hitPoints: 20, armorClass: 15 },
        'monster',
      )

      expect(edited.hitPoints).toBe(20)
      expect(edited.maxHitPoints).toBe(20)
      expect(edited.maxHitPointsOld).toBeUndefined()
      expect(edited.tempHitPoints).toBe(3)
    })

    it('should keep an override while the base hit points stay the same', () => {
      const overridden = { ...row, maxHitPoints: 30, maxHitPointsOld: 12 }

      const edited = editInitiativeRow(
        overridden,
        { name: 'Goblin', hitPoints: 12, armorClass: 15 },
        'monster',
      )

      expect(edited.hitPoints).toBe(4)
      expect(edited.maxHitPoints).toBe(30)
      expect(edited.maxHitPointsOld).toBe(12)
    })

    it('should reset current armor class when the base changes', () => {
      const edited = editInitiativeRow(
        { ...row, armorClass: 10, maxArmorClassOld: 15 },
        { name: 'Goblin', hitPoints: 12, armorClass: 17 },
        'monster',
      )

      expect(edited.armorClass).toBe(17)
      expect(edited.maxArmorClass).toBe(17)
      expect(edited.maxArmorClassOld).toBeUndefined()
      expect(edited.tempArmorClass).toBe(2)
    })
  })

  describe('buildCombatPatch', () => {
    const baseRow: InitiativeSheetRow = {
      id: 'row-1',
      index: 0,
      initiative: 10,
      name: 'Elara',
      type: 'player',
      conditions: [],
      hitPoints: 20,
      maxHitPoints: 20,
      tempHitPoints: 0,
      armorClass: 15,
      maxArmorClass: 20,
      tempArmorClass: 0,
      concentration: false,
      deathSaves: {
        fail: [false, false, false],
        save: [false, false, false],
      },
    }

    it('returns an empty patch when nothing changed', () => {
      expect(buildCombatPatch(baseRow, { ...baseRow })).toEqual({})
    })

    it('only includes fields that changed', () => {
      const after = { ...baseRow, hitPoints: 12, armorClass: 18 }

      expect(buildCombatPatch(baseRow, after)).toEqual({
        hitPoints: 12,
        armorClass: 18,
      })
    })

    it('ignores non-combat fields such as name or initiative', () => {
      const after = { ...baseRow, name: 'Renamed', initiative: 99 }

      expect(buildCombatPatch(baseRow, after)).toEqual({})
    })

    it('includes conditions when the array contents differ', () => {
      const condition = { id: 'blinded', name: 'Blinded', desc: '' }
      const after = { ...baseRow, conditions: [condition] }

      expect(buildCombatPatch(baseRow, after)).toEqual({
        conditions: [condition],
      })
    })

    it('includes deathSaves when they differ', () => {
      const deathSaves = {
        fail: [true, false, false] as [boolean, boolean, boolean],
        save: [false, false, false] as [boolean, boolean, boolean],
      }
      const after = { ...baseRow, deathSaves }

      expect(buildCombatPatch(baseRow, after)).toEqual({ deathSaves })
    })

    it('includes concentration when it changed', () => {
      const after = { ...baseRow, concentration: true }

      expect(buildCombatPatch(baseRow, after)).toEqual({ concentration: true })
    })
  })
})
