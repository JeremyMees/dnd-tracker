export const fiveEToolsCreature = {
  name: 'Bramble Imp',
  source: 'HB',
  size: ['S'],
  type: { type: 'fey', tags: ['imp'] },
  ac: [{ ac: 14, from: ['{@item leather armor|phb}', 'thorns'] }],
  hp: { average: 18, formula: '4d6 + 4' },
  speed: {
    walk: 25,
    fly: { number: 40, condition: '(hover)' },
    canHover: true,
  },
  str: 8,
  dex: 16,
  con: 12,
  int: 10,
  wis: 13,
  cha: 27,
  save: { dex: '+5' },
  skill: { stealth: '+7', 'sleight of hand': '+5' },
  senses: ['darkvision 60 ft.', 'tremorsense 10 ft.'],
  passive: 11,
  languages: ['Sylvan', '{@language Common|PHB}'],
  resist: [
    'cold',
    {
      resist: ['bludgeoning', 'piercing'],
      note: 'from mundane things',
      cond: true,
    },
  ],
  immune: ['poison'],
  conditionImmune: ['poisoned', { conditionImmune: ['charmed'], cond: true }],
  cr: '2',
  trait: [
    {
      name: 'Thorny Hide',
      entries: [
        'A creature that touches the imp takes {@damage 1d4} piercing damage.',
      ],
    },
  ],
  spellcasting: [
    {
      name: 'Innate Spellcasting',
      type: 'spellcasting',
      headerEntries: ['The imp casts spells (spell save {@dc 13}):'],
      will: ['{@spell entangle}'],
      daily: { '1e': ['{@spell thorn whip}', '{@spell blink}'] },
      ability: 'cha',
    },
  ],
  action: [
    {
      name: 'Thorn Lash',
      entries: [
        '{@atk mw} {@hit 5} to hit, reach 10 ft., one target. {@h}7 ({@damage 1d8 + 3}) piercing damage plus 3 ({@damage 1d6}) poison damage.',
      ],
    },
    {
      name: 'Seed Burst {@recharge 5}',
      entries: [
        'Each creature nearby makes a {@dc 13} Dexterity saving throw:',
        { type: 'list', items: ['Failure: blinded', 'Success: nothing'] },
      ],
    },
  ],
  bonus: [
    { name: 'Skitter (2/Day)', entries: ['The imp moves up to its speed.'] },
  ],
  reaction: [{ name: 'Prickle', entries: ['The imp adds 2 to its AC.'] }],
  legendary: [
    { name: 'Whip (Costs 2 Actions)', entries: ['The imp uses Thorn Lash.'] },
  ],
}

export const fiveEToolsCreature2024 = {
  name: 'Ash Hound',
  ac: [13],
  hp: { average: 22, formula: '4d8 + 4' },
  speed: { walk: 40 },
  str: 14,
  dex: 14,
  con: 12,
  int: 3,
  wis: 12,
  cha: 6,
  initiative: { proficiency: 1 },
  cr: { cr: '5', lair: '6' },
  action: [
    {
      name: 'Bite (Hound Form Only)',
      entries: [
        '{@atkr m} {@hit 4}, reach 5 ft. {@h}6 ({@damage 1d8 + 2}) Fire or Radiant damage.',
      ],
    },
  ],
}

export const improvedInitiativeStatBlock = {
  Id: 'abc',
  Name: 'Marsh Lurker',
  Path: '',
  Version: '3.0.0',
  Source: '',
  Type: 'Medium monstrosity',
  HP: { Value: 33, Notes: '(6d8 + 6)' },
  AC: { Value: 13, Notes: '(natural armor)' },
  InitiativeModifier: 3,
  Speed: ['20 ft., swim 40 ft.'],
  Abilities: { Str: 15, Dex: 12, Con: 12, Int: 4, Wis: 11, Cha: 5 },
  DamageVulnerabilities: [],
  DamageResistances: ['cold'],
  DamageImmunities: [],
  ConditionImmunities: ['prone'],
  Saves: [{ Name: 'Con', Modifier: 3 }],
  Skills: [{ Name: 'Stealth', Modifier: 5 }],
  Senses: ['darkvision 30 ft.', 'passive Perception 10'],
  Languages: [],
  Challenge: '1',
  Traits: [
    {
      Name: 'Hold Breath',
      Content: 'The lurker can hold its breath for an hour.',
    },
  ],
  Actions: [
    {
      Name: 'Bite',
      Content:
        'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) piercing damage.',
    },
    {
      Name: 'Mud Spit',
      Content: 'The lurker spits mud at a creature.',
      Usage: '3/Day',
    },
  ],
  BonusActions: [],
  Reactions: [],
  LegendaryActions: [],
  Description: '',
  Player: '',
  ImageURL: '',
}

export const improvedInitiativeExport = {
  Creatures: ['abc', 'def'],
  'Creatures.abc': improvedInitiativeStatBlock,
  'Creatures.def': JSON.stringify({
    ...improvedInitiativeStatBlock,
    Id: 'def',
    Name: 'Reed Witch',
    Player: 'npc',
  }),
  'Characters.ghi': {
    ...improvedInitiativeStatBlock,
    Id: 'ghi',
    Name: 'Kees',
    Player: 'player',
  },
  'ImprovedInitiative.Settings': '{"Theme":"dark"}',
}

export const koboldFightClubFile = {
  sources: [{ name: 'My Book', type: 'Custom', shortname: 'MB', link: '' }],
  monsters: [
    {
      name: 'Bog Zombie',
      cr: '1/2',
      size: 'Medium',
      type: 'Undead',
      ac: 9,
      hp: 30,
      init: -1,
      sources: 'My Book: 3',
    },
  ],
}

export const koboldFightClubCsv = [
  'name,cr,size,type,tags,section,alignment,environment,ac,hp,init,lair?,legendary,unique,sources',
  'Bog Zombie,1/2,Medium,Undead,,Zombies,neutral evil,"swamp, forest",9,30,-1,,,,My Book: 3',
  '"Zombie, Large",2,Large,Undead,,Zombies,neutral evil,swamp,10,52,-2,,,,My Book: 4',
].join('\n')

export const markdownStatblocks = `___
>## Cinder Drake
>*Large Dragon, Chaotic Evil*
>___
>- **Armor Class** 17 (natural armor)
>- **Hit Points** 95 (10d10 + 40)
>- **Speed** 40 ft., climb 20 ft., fly 80 ft.
>___
>|STR|DEX|CON|INT|WIS|CHA|
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|21 (+5)|10 (+0)|19 (+4)|12 (+1)|11 (+0)|15 (+2)|
>___
>- **Saving Throws** Dex +3, Con +7
>- **Skills** Perception +6, Sleight of Hand +3
>- **Damage Resistances** cold; bludgeoning from nonmagical attacks
>- **Damage Immunities** fire
>- **Condition Immunities** frightened
>- **Senses** blindsight 30 ft., darkvision 120 ft., passive Perception 16
>- **Languages** Common, Draconic
>- **Challenge** 7 (2,900 XP)
>___
>***Ember Hide.*** A creature that touches the drake takes 3 (1d6) fire damage.
>
>### Actions
>***Bite.*** *Melee Weapon Attack:* +8 to hit, reach 10 ft., one target. *Hit:* 16 (2d10 + 5) piercing damage plus 4 (1d8) fire damage.
>
>***Cinder Breath (Recharge 5–6).*** The drake exhales embers in a 30-foot cone.
>Each creature there makes a DC 15 Dexterity saving throw.
>
>### Legendary Actions
>The drake can take 2 legendary actions.
>
>**Tail Swipe.** The drake makes a tail attack.
>
>**Smolder (Costs 2 Actions).** The drake glows.
>\\columnbreak

___
>## Moss Sprite
>*Tiny Fey, Neutral*
>___
>- **Armor Class** 13
>- **Hit Points** 4 (1d4 + 2)
>- **Speed** 10 ft., Fly 40 ft. (hover)
>- **Initiative** +4 (14)
>___
>|STR|DEX|CON|INT|WIS|CHA|
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|3 (−4)|18 (+4)|14 (+2)|10 (+0)|13 (+1)|12 (+1)|
>___
>- **Immunities** Poison; Charmed, Poisoned
>- **Senses** Passive Perception 11
>- **Languages** —
>- **Challenge** 1/4 (XP 50; PB +2)
>___
>### Bonus Actions
>***Flit.*** The sprite moves 10 feet.
>
>### Reactions
>***Hide in Moss (1/Day).*** The sprite turns invisible.
`
