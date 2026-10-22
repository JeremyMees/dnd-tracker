import { describe, expect, it } from 'vitest'
import {
  fiveEToolsCreature,
  fiveEToolsCreature2024,
  improvedInitiativeExport,
  improvedInitiativeStatBlock,
  koboldFightClubCsv,
  koboldFightClubFile,
  markdownStatblocks,
} from '~~/test/fixtures/creature-import'

describe('creature-import', () => {
  describe('format checks', () => {
    it('Should recognise each format', () => {
      expect(isFiveEToolsCreature(fiveEToolsCreature)).toBe(true)
      expect(isImprovedInitiativeStatBlock(improvedInitiativeStatBlock)).toBe(
        true,
      )
      expect(isKoboldFightClubCreature(koboldFightClubFile.monsters[0]!)).toBe(
        true,
      )
    })

    it('Should not mistake one format for another', () => {
      expect(isKoboldFightClubCreature(fiveEToolsCreature)).toBe(false)
      expect(isFiveEToolsCreature(improvedInitiativeStatBlock)).toBe(false)
      expect(isImprovedInitiativeStatBlock({ Name: 'Only a name' })).toBe(false)
    })
  })

  describe('fromFiveETools', () => {
    const creature = fromFiveETools(fiveEToolsCreature)

    it('Should read the core stats', () => {
      expect(creature).toMatchObject({
        name: 'Bramble Imp',
        type: 'monster',
        armorClass: 14,
        armorDetail: 'leather armor, thorns',
        hitPoints: 18,
        hitDice: '4d6+4',
        proficiencyBonus: 2,
        challengeRating: 2,
        initiativeModifier: '3',
        passivePerception: 11,
        languages: ['Sylvan', 'Common'],
      })
    })

    it('Should read the movement and senses', () => {
      expect(creature.speed).toEqual({
        unit: 'feet',
        walk: 25,
        fly: 40,
        hover: true,
      })
      expect(creature.sight).toEqual({
        normalSightRange: 0,
        darkVisionRange: 60,
        tremorSenseRange: 10,
      })
    })

    it('Should derive modifiers from scores above 20', () => {
      expect(creature.abilityScores).toMatchObject({
        dexterity: 16,
        charisma: 27,
      })
      expect(creature.modifiers).toMatchObject({ dexterity: 3, charisma: 8 })
    })

    it('Should fill in saves from modifiers and keep listed saves and skills', () => {
      expect(creature.savingThrows).toMatchObject({ dexterity: 5, charisma: 8 })
      expect(creature.skillBonuses).toEqual({ stealth: 7, sleightOfHand: 5 })
    })

    it('Should read plain and conditional resistances and immunities', () => {
      expect(creature.resistancesAndImmunities).toEqual({
        damageImmunities: ['poison'],
        damageResistances: ['cold', 'bludgeoning', 'piercing'],
        damageVulnerabilities: [],
        conditionImmunities: ['poisoned', 'charmed'],
      })
    })

    it('Should turn traits and spellcasting into traits', () => {
      expect(creature.traits).toEqual([
        {
          name: 'Thorny Hide',
          desc: 'A creature that touches the imp takes 1d4 piercing damage.',
        },
        {
          name: 'Innate Spellcasting',
          desc: 'The imp casts spells (spell save DC 13):\nAt will: entangle\n1/day each: thorn whip, blink',
        },
      ])
    })

    it('Should read attacks from the action text', () => {
      expect(creature.actions[0]).toEqual({
        name: 'Thorn Lash',
        actionType: 'action',
        desc: 'Melee Weapon Attack: +5 to hit, reach 10 ft., one target. Hit: 7 (1d8 + 3) piercing damage plus 3 (1d6) poison damage.',
        attacks: [
          {
            name: 'Thorn Lash',
            attackType: 'melee',
            distanceUnit: 'feet',
            toHitMod: 5,
            reach: 10,
            damageDieCount: 1,
            damageDieType: 'd8',
            damageBonus: 3,
            damageType: 'piercing',
            extraDamageDieCount: 1,
            extraDamageDieType: 'd6',
            extraDamageType: 'poison',
          },
        ],
      })
    })

    it('Should keep every action section with its usage', () => {
      expect(
        creature.actions.map(action => [
          action.name,
          action.actionType,
          action.usageLimits,
          action.legendaryActionCost,
        ]),
      ).toEqual([
        ['Thorn Lash', 'action', undefined, undefined],
        ['Seed Burst', 'action', { type: 'recharge', param: 5 }, undefined],
        ['Skitter', 'bonusAction', { type: 'perDay', param: 2 }, undefined],
        ['Prickle', 'reaction', undefined, undefined],
        ['Whip', 'legendaryAction', undefined, 2],
      ])
      expect(creature.actions[1]!.desc).toBe(
        'Each creature nearby makes a DC 13 Dexterity saving throw:\n- Failure: blinded\n- Success: nothing',
      )
    })

    it('Should read the 2024 initiative, challenge and attack roll', () => {
      const hound = fromFiveETools(fiveEToolsCreature2024)

      expect(hound).toMatchObject({
        armorClass: 13,
        proficiencyBonus: 3,
        challengeRating: 5,
        initiativeModifier: '5',
        armorDetail: null,
      })
      expect(hound.actions[0]).toMatchObject({
        name: 'Bite',
        limitedToForm: 'Hound',
        attacks: [{ toHitMod: 4, damageDieCount: 1, damageType: 'fire' }],
      })
    })

    it('Should leave out what a creature does not have', () => {
      expect(
        fromFiveETools({ name: 'Blob', str: 10, hp: { special: 'varies' } }),
      ).toMatchObject({
        hitPoints: null,
        hitDice: null,
        sight: null,
        languages: null,
        skillBonuses: null,
        resistancesAndImmunities: null,
        traits: null,
        actions: [],
      })
    })
  })

  describe('fromImprovedInitiative', () => {
    const creature = fromImprovedInitiative(improvedInitiativeStatBlock)

    it('Should read the core stats', () => {
      expect(creature).toMatchObject({
        name: 'Marsh Lurker',
        type: 'monster',
        armorClass: 13,
        armorDetail: 'natural armor',
        hitPoints: 33,
        hitDice: '6d8+6',
        initiativeModifier: '3',
        proficiencyBonus: 2,
        challengeRating: 1,
        passivePerception: 10,
        languages: null,
      })
    })

    it('Should read speed, senses, saves and skills', () => {
      expect(creature.speed).toEqual({ unit: 'feet', walk: 20, swim: 40 })
      expect(creature.sight).toEqual({
        normalSightRange: 0,
        darkVisionRange: 30,
      })
      expect(creature.modifiers).toMatchObject({ strength: 2, charisma: -3 })
      expect(creature.savingThrows).toMatchObject({
        constitution: 3,
        strength: 2,
      })
      expect(creature.skillBonuses).toEqual({ stealth: 5 })
      expect(creature.resistancesAndImmunities).toMatchObject({
        damageResistances: ['cold'],
        conditionImmunities: ['prone'],
      })
    })

    it('Should read traits, attacks and usage', () => {
      expect(creature.traits).toEqual([
        {
          name: 'Hold Breath',
          desc: 'The lurker can hold its breath for an hour.',
        },
      ])
      expect(creature.actions[0]!.attacks[0]).toMatchObject({
        toHitMod: 4,
        damageDieCount: 1,
        damageDieType: 'd8',
        damageType: 'piercing',
      })
      expect(creature.actions[1]).toMatchObject({
        name: 'Mud Spit',
        usageLimits: { type: 'perDay', param: 3 },
      })
    })

    it('Should keep players and npcs as their own type', () => {
      expect(
        fromImprovedInitiative({
          ...improvedInitiativeStatBlock,
          Player: 'player',
        }).type,
      ).toBe('player')
      expect(
        fromImprovedInitiative({
          ...improvedInitiativeStatBlock,
          Player: 'npc',
        }).type,
      ).toBe('npc')
    })

    it('Should read a combatant sent by Kobold Fight Club', () => {
      expect(
        fromImprovedInitiative({
          Name: 'Goblin',
          HP: { Value: 7 },
          AC: { Value: 15 },
          TotalInitiativeModifier: 2,
        }),
      ).toMatchObject({
        name: 'Goblin',
        armorClass: 15,
        hitPoints: 7,
        initiativeModifier: '2',
        abilityScores: null,
        savingThrows: null,
        speed: null,
      })
    })
  })

  describe('fromKoboldFightClub', () => {
    it('Should read the stats Kobold Fight Club keeps', () => {
      expect(
        fromKoboldFightClub(koboldFightClubFile.monsters[0]!),
      ).toMatchObject({
        name: 'Bog Zombie',
        type: 'monster',
        armorClass: 9,
        hitPoints: 30,
        initiativeModifier: '-1',
        proficiencyBonus: 2,
      })
    })
  })

  describe('findImportedCreatures', () => {
    it('Should find 5e.tools creatures in a bestiary file', () => {
      expect(
        findImportedCreatures({
          monster: [fiveEToolsCreature, fiveEToolsCreature2024],
        }).map(creature => creature.name),
      ).toEqual(['Bramble Imp', 'Ash Hound'])
    })

    it('Should find a single 5e.tools creature', () => {
      expect(findImportedCreatures(fiveEToolsCreature)).toHaveLength(1)
    })

    it('Should find statblocks in an Improved Initiative export, also when stored as text', () => {
      expect(
        findImportedCreatures(improvedInitiativeExport).map(creature => [
          creature.name,
          creature.type,
        ]),
      ).toEqual([
        ['Marsh Lurker', 'monster'],
        ['Reed Witch', 'npc'],
        ['Kees', 'player'],
      ])
    })

    it('Should find creatures in a Kobold Fight Club file', () => {
      expect(findImportedCreatures(koboldFightClubFile)).toEqual([
        expect.objectContaining({ name: 'Bog Zombie' }),
      ])
    })

    it('Should keep the first creature when names repeat', () => {
      expect(
        findImportedCreatures([
          fiveEToolsCreature,
          { ...fiveEToolsCreature, name: 'bramble imp', cr: '9' },
        ]),
      ).toEqual([expect.objectContaining({ name: 'Bramble Imp' })])
    })

    it('Should find nothing in unrelated data', () => {
      expect(findImportedCreatures({ hello: 'world', list: [1, 2] })).toEqual(
        [],
      )
      expect(findImportedCreatures('{not json')).toEqual([])
    })
  })

  describe('creaturesFromCsv', () => {
    it('Should read a Kobold Fight Club csv', () => {
      expect(creaturesFromCsv(koboldFightClubCsv)).toEqual([
        expect.objectContaining({
          name: 'Bog Zombie',
          armorClass: 9,
          hitPoints: 30,
          initiativeModifier: '-1',
        }),
        expect.objectContaining({ name: 'Zombie, Large', proficiencyBonus: 2 }),
      ])
    })

    it('Should skip rows without stats', () => {
      expect(creaturesFromCsv('name,ac,hp\nGhost,,')).toEqual([])
    })
  })

  describe('creaturesFromMarkdown', () => {
    const [drake, sprite] = creaturesFromMarkdown(markdownStatblocks)

    it('Should read the core stats of a classic statblock', () => {
      expect(drake).toMatchObject({
        name: 'Cinder Drake',
        type: 'monster',
        armorClass: 17,
        armorDetail: 'natural armor',
        hitPoints: 95,
        hitDice: '10d10+40',
        initiativeModifier: '0',
        proficiencyBonus: 3,
        challengeRating: 7,
        passivePerception: 16,
        languages: ['Common', 'Draconic'],
        speed: { unit: 'feet', walk: 40, climb: 20, fly: 80 },
        sight: {
          normalSightRange: 0,
          darkVisionRange: 120,
          blindSightRange: 30,
        },
      })
    })

    it('Should read scores, saves, skills and resistances', () => {
      expect(drake!.modifiers).toMatchObject({ strength: 5, constitution: 4 })
      expect(drake!.savingThrows).toMatchObject({
        dexterity: 3,
        constitution: 7,
        strength: 5,
      })
      expect(drake!.skillBonuses).toEqual({ perception: 6, sleightOfHand: 3 })
      expect(drake!.resistancesAndImmunities).toEqual({
        damageImmunities: ['fire'],
        damageResistances: ['cold', 'bludgeoning'],
        damageVulnerabilities: [],
        conditionImmunities: ['frightened'],
      })
    })

    it('Should read traits, attacks, recharge and legendary actions', () => {
      expect(drake!.traits).toEqual([
        {
          name: 'Ember Hide',
          desc: 'A creature that touches the drake takes 3 (1d6) fire damage.',
        },
      ])
      expect(
        drake!.actions.map(action => [
          action.name,
          action.actionType,
          action.usageLimits,
          action.legendaryActionCost,
        ]),
      ).toEqual([
        ['Bite', 'action', undefined, undefined],
        ['Cinder Breath', 'action', { type: 'recharge', param: 5 }, undefined],
        ['Tail Swipe', 'legendaryAction', undefined, undefined],
        ['Smolder', 'legendaryAction', undefined, 2],
      ])
      expect(drake!.actions[0]!.attacks[0]).toMatchObject({
        toHitMod: 8,
        reach: 10,
        damageDieCount: 2,
        damageDieType: 'd10',
        damageBonus: 5,
        damageType: 'piercing',
        extraDamageDieCount: 1,
        extraDamageType: 'fire',
      })
    })

    it('Should read a 2024 statblock with initiative and combined immunities', () => {
      expect(sprite).toMatchObject({
        name: 'Moss Sprite',
        initiativeModifier: '4',
        proficiencyBonus: 2,
        challengeRating: 0.25,
        passivePerception: 11,
        languages: null,
        sight: null,
        speed: { unit: 'feet', walk: 10, fly: 40, hover: true },
      })
      expect(sprite!.resistancesAndImmunities).toMatchObject({
        damageImmunities: ['poison'],
        conditionImmunities: ['charmed', 'poisoned'],
      })
      expect(
        sprite!.actions.map(action => [
          action.name,
          action.actionType,
          action.usageLimits,
        ]),
      ).toEqual([
        ['Flit', 'bonusAction', undefined],
        ['Hide in Moss', 'reaction', { type: 'perDay', param: 1 }],
      ])
    })

    it('Should leave out stats a statblock does not list', () => {
      expect(
        creaturesFromMarkdown('## Shade\n- **Armor Class** 12')[0],
      ).toMatchObject({
        armorClass: 12,
        abilityScores: null,
        savingThrows: null,
        initiativeModifier: '0',
        actions: [],
      })
    })
  })
})
