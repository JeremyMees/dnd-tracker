import { describe, expect, it } from 'vitest'
import { open5eV2MonsterFixture, open5eV1MonsterFixture } from '~~/test/nuxt/fixtures/open5e'

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

      const legendaryActions = monster.actions.filter(a => a.actionType === 'legendaryAction')
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
  })
})
