import { describe, expect, it } from 'vitest'
import { markdownStatblocks } from '~~/test/fixtures/creature-import'

describe('statblock-text', () => {
  describe('stripFiveEToolsTags', () => {
    it.each([
      ['{@atk mw} {@hit 4} to hit', 'Melee Weapon Attack: +4 to hit'],
      ['{@atk rw}', 'Ranged Weapon Attack:'],
      ['{@atk mw,rw}', 'Melee or Ranged Weapon Attack:'],
      ['{@atk ms}', 'Melee Spell Attack:'],
      ['{@atkr m} {@hit 4}', 'Melee Attack Roll: +4'],
      ['{@atkr r}', 'Ranged Attack Roll:'],
      ['{@hit -1}', '-1'],
      ['{@h}5 damage', 'Hit: 5 damage'],
      ['{@dc 13}', 'DC 13'],
      ['Breath {@recharge 5}', 'Breath (Recharge 5–6)'],
      ['Breath {@recharge}', 'Breath (Recharge 6)'],
      ['{@actSave dex} {@dc 21}', 'Dexterity Saving Throw: DC 21'],
      ['{@actSaveFail} 10 {@actSaveSuccess} Half', 'Failure: 10 Success: Half'],
      ['{@actSaveFail 5}', 'Failure by 5 or More:'],
      ['{@actTrigger} x {@actResponse} y', 'Trigger: x Response: y'],
      ['{@chance 50}', '50 percent'],
      ['{@spell fireball}', 'fireball'],
      ['{@item leather armor|phb}', 'leather armor'],
      ['{@variantrule Cone [Area of Effect]|XPHB|Cone}', 'Cone'],
      ['{@damage 2d6 + 3}', '2d6 + 3'],
      ['{@unknownTag}', ''],
    ])('Should turn %s into %s', (text, expected) => {
      expect(stripFiveEToolsTags(text)).toBe(expected)
    })
  })

  describe('flattenEntries', () => {
    it('Should join text entries on new lines', () => {
      expect(flattenEntries(['First {@dc 10}.', 'Second.'])).toBe(
        'First DC 10.\nSecond.',
      )
    })

    it('Should turn lists into bullet lines', () => {
      expect(
        flattenEntries([
          { type: 'list', items: ['One', { name: 'Two', entry: 'Yes' }] },
        ]),
      ).toBe('- One\n- Two. Yes')
    })

    it('Should prefix named entries with their name', () => {
      expect(
        flattenEntries({
          type: 'entries',
          name: 'Note',
          entries: ['Read me.'],
        }),
      ).toBe('Note. Read me.')
    })

    it('Should ignore values it cannot read', () => {
      expect(flattenEntries(null)).toBe('')
      expect(flattenEntries(4)).toBe('')
    })
  })

  describe('parseActionName', () => {
    it.each([
      [
        'Fire Breath (Recharge 5–6)',
        'Fire Breath',
        { type: 'recharge', param: 5 },
      ],
      [
        'Fire Breath (Recharge 5-6)',
        'Fire Breath',
        { type: 'recharge', param: 5 },
      ],
      [
        'Fire Breath (Recharge 6)',
        'Fire Breath',
        { type: 'recharge', param: 6 },
      ],
      ['Mud Spit (3/Day)', 'Mud Spit', { type: 'perDay', param: 3 }],
      [
        'Legendary Resistance (3/Day, or 4/Day in Lair)',
        'Legendary Resistance',
        { type: 'perDay', param: 3 },
      ],
      [
        'Shift (Recharges after a Short or Long Rest)',
        'Shift',
        { type: 'perRest', param: 1 },
      ],
    ])('Should read the usage of %s', (raw, name, usageLimits) => {
      expect(parseActionName(raw)).toEqual({ name, usageLimits })
    })

    it('Should read the legendary action cost', () => {
      expect(parseActionName('Wing Attack (Costs 2 Actions)')).toEqual({
        name: 'Wing Attack',
        legendaryActionCost: 2,
      })
    })

    it('Should read the form an action is limited to', () => {
      expect(parseActionName('Bite (Wolf or Hybrid Form Only)')).toEqual({
        name: 'Bite',
        limitedToForm: 'Wolf or Hybrid',
      })
    })

    it('Should leave a plain name alone', () => {
      expect(parseActionName('Multiattack')).toEqual({ name: 'Multiattack' })
    })
  })

  describe('parseAttack', () => {
    it('Should read a 2014 melee weapon attack with extra damage', () => {
      expect(
        parseAttack(
          'Bite',
          'Melee Weapon Attack: +14 to hit, reach 10 ft., one target. Hit: 19 (2d10 + 8) piercing damage plus 7 (2d6) fire damage.',
        ),
      ).toEqual({
        name: 'Bite',
        attackType: 'melee',
        distanceUnit: 'feet',
        toHitMod: 14,
        reach: 10,
        damageDieCount: 2,
        damageDieType: 'd10',
        damageBonus: 8,
        damageType: 'piercing',
        extraDamageDieCount: 2,
        extraDamageDieType: 'd6',
        extraDamageType: 'fire',
      })
    })

    it('Should read a 2024 ranged attack roll with a long range', () => {
      expect(
        parseAttack(
          'Shortbow',
          'Ranged Attack Roll: +4, range 80/320 ft. Hit: 5 (1d6 + 2) Piercing damage.',
        ),
      ).toEqual({
        name: 'Shortbow',
        attackType: 'ranged',
        distanceUnit: 'feet',
        toHitMod: 4,
        range: 80,
        longRange: 320,
        damageDieCount: 1,
        damageDieType: 'd6',
        damageBonus: 2,
        damageType: 'piercing',
      })
    })

    it.each([
      ['Melee Spell Attack: +5 to hit', 'meleeSpell'],
      ['Ranged Spell Attack: +5 to hit', 'rangedSpell'],
      ['Melee or Ranged Weapon Attack: +5 to hit', 'melee'],
    ])('Should read %s as a %s attack', (text, attackType) => {
      expect(parseAttack('Hit', text)?.attackType).toBe(attackType)
    })

    it('Should take the first type when the damage type is a choice', () => {
      expect(
        parseAttack(
          'Ray',
          'Ranged Attack Roll: +15, range 600 ft. Hit: 35 (6d8 + 8) Necrotic or Radiant damage.',
        ),
      ).toMatchObject({ damageDieCount: 6, damageType: 'necrotic' })
    })

    it('Should keep the dice when the damage has no type', () => {
      const attack = parseAttack(
        'Burst',
        'Melee Attack Roll: +7, reach 5 ft. Hit: 25 (6d6 + 4) damage of a type chosen by the cultist.',
      )

      expect(attack).toMatchObject({ damageDieCount: 6, damageBonus: 4 })
      expect(attack).not.toHaveProperty('damageType')
    })

    it('Should not invent dice for flat damage', () => {
      expect(
        parseAttack(
          'Bite',
          'Melee Attack Roll: +2, reach 5 ft. Hit: 1 Piercing damage.',
        ),
      ).not.toHaveProperty('damageDieCount')
    })

    it('Should skip dice the app cannot roll', () => {
      expect(
        parseAttack(
          'Odd',
          'Melee Weapon Attack: +2 to hit. Hit: 4 (1d7) fire damage.',
        ),
      ).not.toHaveProperty('damageDieCount')
    })

    it('Should not treat later damage without plus as extra damage', () => {
      expect(
        parseAttack(
          'Bite',
          'Melee Weapon Attack: +4 to hit. Hit: 5 (1d6 + 2) piercing damage. If it fails, it takes 7 (2d6) poison damage.',
        ),
      ).not.toHaveProperty('extraDamageDieCount')
    })

    it('Should return undefined for text without an attack', () => {
      expect(
        parseAttack(
          'Breath',
          'Each creature makes a DC 13 Dexterity saving throw.',
        ),
      ).toBeUndefined()
    })
  })

  describe('parseStatblockMarkdown', () => {
    const [drake, sprite] = parseStatblockMarkdown(markdownStatblocks)

    it('Should find every statblock in the text', () => {
      expect(
        parseStatblockMarkdown(markdownStatblocks).map(block => block.name),
      ).toEqual(['Cinder Drake', 'Moss Sprite'])
    })

    it('Should read the property lines without markdown', () => {
      expect(drake!.properties).toMatchObject({
        'armor class': '17 (natural armor)',
        'hit points': '95 (10d10 + 40)',
        'saving throws': 'Dex +3, Con +7',
        senses: 'blindsight 30 ft., darkvision 120 ft., passive Perception 16',
      })
      expect(sprite!.properties).toMatchObject({
        initiative: '+4 (14)',
        immunities: 'Poison; Charmed, Poisoned',
      })
    })

    it('Should read the ability score table', () => {
      expect(drake!.abilityScores).toEqual({
        str: 21,
        dex: 10,
        con: 19,
        int: 12,
        wis: 11,
        cha: 15,
      })
    })

    it('Should group entries by section and join their lines', () => {
      expect(drake!.sections.traits).toEqual([
        {
          name: 'Ember Hide',
          desc: 'A creature that touches the drake takes 3 (1d6) fire damage.',
        },
      ])
      expect(drake!.sections.actions![1]).toEqual({
        name: 'Cinder Breath (Recharge 5–6)',
        desc: 'The drake exhales embers in a 30-foot cone.\nEach creature there makes a DC 15 Dexterity saving throw.',
      })
    })

    it('Should skip the legendary intro and read bold entries', () => {
      expect(drake!.sections['legendary actions']).toEqual([
        { name: 'Tail Swipe', desc: 'The drake makes a tail attack.' },
        { name: 'Smolder (Costs 2 Actions)', desc: 'The drake glows.' },
      ])
    })

    it('Should strip emphasis and links from descriptions', () => {
      const [block] = parseStatblockMarkdown(
        '## Test\n***Note.*** Cast *[dispel magic](https://x.y)*  now.',
      )

      expect(block!.sections.traits).toEqual([
        { name: 'Note', desc: 'Cast dispel magic now.' },
      ])
    })

    it('Should return nothing for text without a statblock', () => {
      expect(parseStatblockMarkdown('just some notes')).toEqual([])
    })
  })
})
