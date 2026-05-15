export const open5eV1SpellFixture = {
  slug: 'acid-arrow',
  name: 'Acid Arrow',
  school: 'Evocation',
  dnd_class: 'Wizard',
  range: '90 feet',
  level: '2',
  components: 'V, S, M',
  material: 'powdered rhubarb leaf',
  concentration: 'no',
  ritual: 'no',
  casting_time: '1 action',
  duration: 'Instantaneous',
  desc: 'A shimmering green arrow...',
  higher_level: '',
} as unknown as Open5eV1Item

export const open5eV1WeaponFixture = {
  slug: 'longsword',
  name: 'Longsword',
  properties: ['Versatile'],
  damage_type: 'Slashing',
  damage_dice: '1d8',
  range: '5',
} as unknown as Open5eV1Item

export const open5eV1ArmorFixture = {
  slug: 'chain-mail',
  name: 'Chain Mail',
  category: 'Heavy Armor',
  armor_class: 16,
  stealth_disadvantage: 'true',
  strength_requirement: 'Requires 13 Strength',
} as unknown as Open5eV1Item

export const open5eV1MagicItemFixture = {
  slug: 'bag-of-holding',
  name: 'Bag of Holding',
  desc: 'This bag has an interior space...',
  category: 'Wondrous Item',
  rarity: 'Uncommon',
  requires_attunement: '',
  weight: '15',
  cost: '0',
} as unknown as Open5eV1Item

export const open5eV1MagicItemWeaponFixture = {
  slug: 'flame-tongue',
  name: 'Flame Tongue',
  desc: 'You can use a bonus action...',
  category: 'Weapon',
  rarity: 'Rare',
  requires_attunement: 'requires attunement',
  damage_dice: '1d6',
  damage_type: 'Fire',
  weight: '3',
  cost: '0',
} as unknown as Open5eV1Item

export const open5eV1MonsterFixture = {
  slug: 'goblin',
  name: 'Goblin',
  type: 'humanoid',
  size: 'Small',
  challenge_rating: '1/4',
  cr: 0.25,
  alignment: 'neutral evil',
  speed: { walk: 30 },
  languages: 'Common, Goblin',
  armor_class: 15,
  armor_desc: 'leather armor',
  hit_points: 7,
  hit_dice: '2d6',
  xp: 50,
  strength: 8,
  dexterity: 14,
  constitution: 10,
  intelligence: 10,
  wisdom: 8,
  charisma: 8,
  constitution_save: 0,
  intelligence_save: 0,
  wisdom_save: 0,
  strength_save: null,
  dexterity_save: null,
  charisma_save: null,
  perception: 9,
  skills: { stealth: 6 },
  damage_vulnerabilities: '',
  damage_resistances: '',
  damage_immunities: '',
  condition_immunities: '',
  senses: 'darkvision 60 ft.',
  actions: [{ name: 'Scimitar', desc: 'Melee Weapon Attack...', attack_bonus: 4, damage_bonus: 2, damage_dice: '1d6' }],
  legendary_actions: [],
  reactions: [],
  special_abilities: [{ name: 'Nimble Escape', desc: 'The goblin can...' }],
} as unknown as Open5eV1Item

export const open5eV1ConditionFixture = {
  slug: 'blinded',
  name: 'Blinded',
  desc: 'The creature cannot see and automatically fails any ability check that requires sight.',
  effects_desc: [],
} as unknown as Open5eV1Item

export const open5eV1ExhaustionFixture = {
  slug: 'exhaustion',
  name: 'Exhaustion',
  desc: '',
  effects_desc: [
    'Level 1: Disadvantage on ability checks.',
    'Level 2: Speed halved.',
  ],
  level: '2',
} as unknown as Open5eV1Item
