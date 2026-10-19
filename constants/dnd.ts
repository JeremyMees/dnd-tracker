export const crOptions = [
  { label: '0', value: 0.0 },
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1.0 },
  { label: '2', value: 2.0 },
  { label: '3', value: 3.0 },
  { label: '4', value: 4.0 },
  { label: '5', value: 5.0 },
  { label: '6', value: 6.0 },
  { label: '7', value: 7.0 },
  { label: '8', value: 8.0 },
  { label: '9', value: 9.0 },
  { label: '10', value: 10.0 },
  { label: '11', value: 11.0 },
  { label: '12', value: 12.0 },
  { label: '13', value: 13.0 },
  { label: '14', value: 14.0 },
  { label: '15', value: 15.0 },
  { label: '16', value: 16.0 },
  { label: '17', value: 17.0 },
  { label: '18', value: 18.0 },
  { label: '19', value: 19.0 },
  { label: '20', value: 20.0 },
  { label: '21', value: 21.0 },
  { label: '22', value: 22.0 },
  { label: '23', value: 23.0 },
  { label: '24', value: 24.0 },
  { label: '30', value: 30.0 },
]

export const gameSystems: DndGameSystem[] = ['5e-2014', '5e-2024']

export const dndContentTypes = [
  'spells',
  'monsters',
  'conditions',
  'magicitems',
  'weapons',
  'armor',
] as const satisfies readonly DndContentType[]

export const dndSortOptions = [
  'name',
  'hitPoints',
  '-hitPoints',
  'armorClass',
  '-armorClass',
  'challengeRating',
  '-challengeRating',
] as const satisfies readonly DndSortBy[]

export const abilityTypes = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export const abilityTypeMap: Record<(typeof abilityTypes)[number], DndAbility> =
  {
    STR: 'strength',
    DEX: 'dexterity',
    CON: 'constitution',
    INT: 'intelligence',
    WIS: 'wisdom',
    CHA: 'charisma',
  }

export const dices: DndDiceSide[] = [4, 6, 8, 10, 12, 20, 100]

export const damageTypes: DndDamageType[] = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
]

export const bloodiedConditionId = 'bloodied'

export const conditionTypes: DndConditionType[] = [
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'exhaustion',
]

export const alignmentMap: Record<string, DndAlignment> = {
  'lawful good': 'lawfulGood',
  'neutral good': 'neutralGood',
  'chaotic good': 'chaoticGood',
  'lawful neutral': 'lawfulNeutral',
  neutral: 'trueNeutral',
  'true neutral': 'trueNeutral',
  'chaotic neutral': 'chaoticNeutral',
  'lawful evil': 'lawfulEvil',
  'neutral evil': 'neutralEvil',
  'chaotic evil': 'chaoticEvil',
}

export const monsterTypeMap: Record<string, DndMonsterType> = {
  aberration: 'aberration',
  beast: 'beast',
  celestial: 'celestial',
  construct: 'construct',
  dragon: 'dragon',
  elemental: 'elemental',
  fey: 'fey',
  fiend: 'fiend',
  giant: 'giant',
  humanoid: 'humanoid',
  monstrosity: 'monstrosity',
  ooze: 'ooze',
  plant: 'plant',
  undead: 'undead',
}

export const sizeMap: Record<string, DndSize> = {
  tiny: 'tiny',
  small: 'small',
  medium: 'medium',
  large: 'large',
  huge: 'huge',
  gargantuan: 'gargantuan',
}

export const skillKeyMap: Record<string, DndSkill> = {
  acrobatics: 'acrobatics',
  animal_handling: 'animalHandling',
  arcana: 'arcana',
  athletics: 'athletics',
  deception: 'deception',
  history: 'history',
  insight: 'insight',
  intimidation: 'intimidation',
  investigation: 'investigation',
  medicine: 'medicine',
  nature: 'nature',
  perception: 'perception',
  performance: 'performance',
  persuasion: 'persuasion',
  religion: 'religion',
  sleight_of_hand: 'sleightOfHand',
  stealth: 'stealth',
  survival: 'survival',
}

export const skillMap: Record<DndSkill, string> = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
}

export const usageTypeMap: Record<string, DndUsageType> = {
  per_day: 'perDay',
  perday: 'perDay',
  recharge: 'recharge',
  at_will: 'atWill',
  atwill: 'atWill',
  per_rest: 'perRest',
  perrest: 'perRest',
}

export const armorTypeMap: Record<string, DndArmorType> = {
  light: 'light',
  medium: 'medium',
  heavy: 'heavy',
}

export const magicItemTypeMap: Record<string, DndMagicItemType> = {
  armor: 'armor',
  potion: 'potion',
  ring: 'ring',
  rod: 'rod',
  scroll: 'scroll',
  staff: 'staff',
  wand: 'wand',
  weapon: 'weapon',
  'wondrous item': 'wondrousItem',
  wondrousitem: 'wondrousItem',
}

export const spellSchoolMap: Record<string, DndSpellSchool> = {
  abjuration: 'abjuration',
  conjuration: 'conjuration',
  divination: 'divination',
  enchantment: 'enchantment',
  evocation: 'evocation',
  illusion: 'illusion',
  necromancy: 'necromancy',
  transmutation: 'transmutation',
}

export const classMap: Record<string, DndClass> = {
  barbarian: 'barbarian',
  bard: 'bard',
  cleric: 'cleric',
  druid: 'druid',
  fighter: 'fighter',
  monk: 'monk',
  paladin: 'paladin',
  ranger: 'ranger',
  rogue: 'rogue',
  sorcerer: 'sorcerer',
  warlock: 'warlock',
  wizard: 'wizard',
}

export const abilityMap: Record<string, DndAbility> = {
  str: 'strength',
  STR: 'strength',
  strength: 'strength',
  dex: 'dexterity',
  DEX: 'dexterity',
  dexterity: 'dexterity',
  con: 'constitution',
  CON: 'constitution',
  constitution: 'constitution',
  int: 'intelligence',
  INT: 'intelligence',
  intelligence: 'intelligence',
  wis: 'wisdom',
  WIS: 'wisdom',
  wisdom: 'wisdom',
  cha: 'charisma',
  CHA: 'charisma',
  charisma: 'charisma',
}

export const shapeTypeMap: Record<string, DndShapeType> = {
  cone: 'cone',
  cube: 'cube',
  cylinder: 'cylinder',
  line: 'line',
  sphere: 'sphere',
}

export const speedTypes: DndSpeedType[] = [
  'walk',
  'crawl',
  'hover',
  'fly',
  'burrow',
  'climb',
  'swim',
]

export const speedMap: Record<DndSpeedType, string> = {
  walk: 'Walk',
  crawl: 'Crawl',
  hover: 'Hover',
  fly: 'Fly',
  burrow: 'Burrow',
  climb: 'Climb',
  swim: 'Swim',
}

export const attackTypes: DndAttackType[] = [
  'melee',
  'ranged',
  'meleeSpell',
  'rangedSpell',
]

export const usageTypes: DndUsageType[] = [
  'perDay',
  'recharge',
  'atWill',
  'perRest',
]

export const diceTypes = [
  'd4',
  'd6',
  'd8',
  'd10',
  'd12',
  'd20',
  'd100',
] as const satisfies readonly DndRollableDice[]

export const distanceUnits: DndDistanceUnit[] = ['feet', 'miles']

export const speedUnitMap: Record<DndDistanceUnit, string> = {
  feet: 'ft',
  miles: 'mi',
}

export const sightRangeTypes: DndSightRangeType[] = [
  'normalSightRange',
  'darkVisionRange',
  'blindSightRange',
  'tremorSenseRange',
  'trueSightRange',
]

export const sightRangeMap: Record<DndSightRangeType, string> = {
  normalSightRange: 'Normal Sight',
  darkVisionRange: 'Darkvision',
  blindSightRange: 'Blindsight',
  tremorSenseRange: 'Tremorsense',
  trueSightRange: 'Truesight',
}

export const resistanceTypes: DndResistanceType[] = [
  'damageImmunities',
  'damageResistances',
  'damageVulnerabilities',
  'conditionImmunities',
]

export const resistanceTypeMap: Record<DndResistanceType, string> = {
  damageImmunities: 'Damage immunities',
  damageResistances: 'Damage resistances',
  damageVulnerabilities: 'Damage vulnerabilities',
  conditionImmunities: 'Condition immunities',
}

export const defaultSrdDocuments = ['srd-2024']

export const challengeExperience: Record<number, number> = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  26: 90000,
  27: 105000,
  28: 120000,
  29: 135000,
  30: 155000,
}

export const challengeRatings: number[] = Object.keys(challengeExperience)
  .map(Number)
  .sort((a, b) => a - b)

export const experienceBudgets: Record<number, ExperienceBudget> = {
  1: { low: 50, moderate: 75, high: 100 },
  2: { low: 100, moderate: 150, high: 200 },
  3: { low: 150, moderate: 225, high: 400 },
  4: { low: 250, moderate: 375, high: 500 },
  5: { low: 500, moderate: 750, high: 1100 },
  6: { low: 600, moderate: 1000, high: 1400 },
  7: { low: 750, moderate: 1300, high: 1700 },
  8: { low: 1000, moderate: 1700, high: 2100 },
  9: { low: 1300, moderate: 2000, high: 2600 },
  10: { low: 1600, moderate: 2300, high: 3100 },
  11: { low: 1900, moderate: 2900, high: 4100 },
  12: { low: 2200, moderate: 3700, high: 4700 },
  13: { low: 2600, moderate: 4200, high: 5400 },
  14: { low: 2900, moderate: 4900, high: 6200 },
  15: { low: 3300, moderate: 5400, high: 7800 },
  16: { low: 3800, moderate: 6100, high: 9800 },
  17: { low: 4500, moderate: 7200, high: 11700 },
  18: { low: 5000, moderate: 8700, high: 14200 },
  19: { low: 5500, moderate: 10700, high: 17200 },
  20: { low: 6400, moderate: 13200, high: 22000 },
}

export const extremeDifficultyFactor = 1.5
