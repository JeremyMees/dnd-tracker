import { describe, expect, it } from 'vitest'
import {
  open5eV2MonsterFixture,
  open5eV1MonsterFixture,
} from '~~/test/fixtures/open5e'

describe('transformers/monster', () => {
  describe('toMonster (V2)', () => {
    it('maps core identity fields', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.id).toBe('a5e-mm_aboleth')
      expect(monster.name).toBe('Aboleth')
      expect(monster.type).toBe('aberration')
      expect(monster.size).toBe('large')
    })

    it('maps ability scores', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.abilityScores.strength).toBe(20)
      expect(monster.abilityScores.dexterity).toBe(12)
      expect(monster.abilityScores.constitution).toBe(18)
      expect(monster.abilityScores.intelligence).toBe(20)
      expect(monster.abilityScores.wisdom).toBe(20)
      expect(monster.abilityScores.charisma).toBe(18)
    })

    it('maps challenge rating', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.challengeRating).toBe(11)
    })

    it('maps combat stats', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.armorClass).toBe(17)
      expect(monster.hitPoints).toBe(171)
      expect(monster.hitDice.hitDiceCount).toBe(18)
      expect(monster.hitDice.hitDiceType).toBe('d10')
    })

    it('maps actions', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.actions.length).toBeGreaterThan(0)

      const tentacle = monster.actions.find(a => a.name === 'Tentacle')
      expect(tentacle).toBeDefined()
      expect(tentacle!.actionType).toBe('action')
      expect(tentacle!.attacks.length).toBe(1)
      expect(tentacle!.attacks[0]!.toHitMod).toBe(9)
    })

    it('maps legendary actions', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      const legendaryActions = monster.actions.filter(
        a => a.actionType === 'legendaryAction',
      )
      expect(legendaryActions.length).toBeGreaterThan(0)
    })

    it('maps traits', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.traits.length).toBeGreaterThan(0)
      expect(monster.traits[0]!.name).toBe('Amphibious')
    })

    it('maps speed', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.speed.walk).toBe(10)
      expect(monster.speed.swim).toBe(40)
    })

    it('maps sight/senses', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.sight.darkVisionRange).toBe(120)
      expect(monster.sight.blindSightRange).toBe(30)
    })

    it('maps skill bonuses converting snake_case keys to camelCase', () => {
      const monster = toMonster(open5eV2MonsterFixture)

      expect(monster.skillBonuses.animalHandling).toBe(5)
      expect(monster.skillBonuses.sleightOfHand).toBe(1)
      expect(monster.skillBonuses.stealth).toBe(5)
    })

    it('maps resistances and immunities entries by name', () => {
      const entry = (name: string) => ({ name, key: name, url: '' })

      const monster = toMonster({
        ...open5eV2MonsterFixture,
        resistances_and_immunities: {
          damage_immunities_display: 'fire',
          damage_immunities: [entry('Fire')],
          damage_resistances_display: 'cold, poison',
          damage_resistances: [entry('Cold'), entry('Poison')],
          damage_vulnerabilities_display: 'thunder',
          damage_vulnerabilities: [entry('Thunder')],
          condition_immunities_display: 'charmed, frightened',
          condition_immunities: [entry('Charmed'), entry('Frightened')],
        },
      })

      expect(monster.resistancesAndImmunities.damageImmunities).toEqual([
        'fire',
      ])
      expect(monster.resistancesAndImmunities.damageResistances).toEqual([
        'cold',
        'poison',
      ])
      expect(monster.resistancesAndImmunities.damageVulnerabilities).toEqual([
        'thunder',
      ])
      expect(monster.resistancesAndImmunities.conditionImmunities).toEqual([
        'charmed',
        'frightened',
      ])
    })

    it('omits speed entries that are absent', () => {
      const monster = toMonster({
        ...open5eV2MonsterFixture,
        speed_all: { unit: 'feet', walk: 30 },
      })

      expect(monster.speed.walk).toBe(30)
      expect(monster.speed.fly).toBeUndefined()
      expect(monster.speed.burrow).toBeUndefined()
      expect(monster.speed.climb).toBeUndefined()
      expect(monster.speed.swim).toBeUndefined()
      expect(monster.speed.crawl).toBeUndefined()
      expect(monster.speed.hover).toBeUndefined()
    })

    it('defaults sight ranges when the api returns null', () => {
      const monster = toMonster({
        ...open5eV2MonsterFixture,
        normal_sight_range: null,
        darkvision_range: null,
        blindsight_range: null,
      })

      expect(monster.sight.normalSightRange).toBe(0)
      expect(monster.sight.darkVisionRange).toBeUndefined()
      expect(monster.sight.blindSightRange).toBeUndefined()
    })

    it('maps proficiency bonus when present', () => {
      const monster = toMonster({
        ...open5eV2MonsterFixture,
        proficiency_bonus: 4,
      })

      expect(monster.proficiencyBonus).toBe(4)
    })

    it('falls back to category when the type has no name', () => {
      const monster = toMonster({
        ...open5eV2MonsterFixture,
        type: { name: '', key: '', url: '' },
        category: 'Beast',
      })

      expect(monster.type).toBe('beast')
    })

    it('tolerates missing actions and traits', () => {
      const monster = toMonster({
        ...open5eV2MonsterFixture,
        actions: undefined,
        traits: undefined,
      } as unknown as Open5eMonster)

      expect(monster.actions).toEqual([])
      expect(monster.traits).toEqual([])
    })
  })

  describe('toMonster (V1)', () => {
    it('maps core identity fields using slug as id', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.id).toBe('goblin')
      expect(monster.name).toBe('Goblin')
      expect(monster.type).toBe('humanoid')
      expect(monster.size).toBe('small')
    })

    it('maps ability scores from top-level fields', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.abilityScores.strength).toBe(8)
      expect(monster.abilityScores.dexterity).toBe(14)
      expect(monster.abilityScores.constitution).toBe(10)
      expect(monster.abilityScores.intelligence).toBe(10)
      expect(monster.abilityScores.wisdom).toBe(8)
      expect(monster.abilityScores.charisma).toBe(8)
    })

    it('maps combat stats', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.armorClass).toBe(15)
      expect(monster.hitPoints).toBe(7)
      expect(monster.hitDice.hitDiceCount).toBe(2)
      expect(monster.hitDice.hitDiceType).toBe('d6')
      expect(monster.experiencePoints).toBe(50)
    })

    it('maps challenge rating', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.challengeRating).toBe(0.25)
    })

    it('maps alignment', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.alignment).toBe('neutralEvil')
    })

    it('maps speed from object', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.speed.walk).toBe(30)
      expect(monster.speed.unit).toBe('feet')
    })

    it('maps actions from actions array with attack stats', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.actions.length).toBeGreaterThan(0)

      const scimitar = monster.actions.find(a => a.name === 'Scimitar')
      expect(scimitar).toBeDefined()
      expect(scimitar!.actionType).toBe('action')
      expect(scimitar!.attacks.length).toBe(1)
      expect(scimitar!.attacks[0]!.toHitMod).toBe(4)
      expect(scimitar!.attacks[0]!.damageBonus).toBe(2)
    })

    it('maps traits from special_abilities', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.traits.length).toBe(1)
      expect(monster.traits[0]!.name).toBe('Nimble Escape')
    })

    it('parses darkvision from senses string', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.sight.darkVisionRange).toBe(60)
    })

    it('maps passive perception', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.passivePerception).toBe(9)
    })

    it('maps skill bonuses converting snake_case keys to camelCase', () => {
      const monster = toMonster(open5eV1MonsterFixture)

      expect(monster.skillBonuses.stealth).toBe(6)
      expect(monster.skillBonuses.animalHandling).toBe(0)
      expect(monster.skillBonuses.sleightOfHand).toBe(0)
    })

    it('falls back to category when type is empty', () => {
      const monster = toMonster({
        ...open5eV1MonsterFixture,
        type: '' as Open5eType,
        category: 'Dragon',
      })

      expect(monster.type).toBe('dragon')
    })

    it('defaults experience points to 0 when xp is absent', () => {
      const monster = toMonster({ ...open5eV1MonsterFixture, xp: undefined })

      expect(monster.experiencePoints).toBe(0)
    })
  })
})
