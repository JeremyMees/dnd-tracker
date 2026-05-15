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

export const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export const abilitiesNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']

export const initiativeKeys = [
  'armorClass',
  'campaign',
  'concentration',
  'createdAt',
  'conditions',
  'deathSaves',
  'hitPoints',
  'id',
  'index',
  'initiative',
  'initiativeModifier',
  'link',
  'maxArmorClass',
  'maxHitPoints',
  'maxArmorClassOld',
  'maxHitPointsOld',
  'name',
  'note',
  'player',
  'tempArmorClass',
  'tempHitPoints',
  'type',
  'summoner',
  'actions',
]

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
  'neutral': 'trueNeutral',
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
  'armor': 'armor',
  'potion': 'potion',
  'ring': 'ring',
  'rod': 'rod',
  'scroll': 'scroll',
  'staff': 'staff',
  'wand': 'wand',
  'weapon': 'weapon',
  'wondrous item': 'wondrousItem',
  'wondrousitem': 'wondrousItem',
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
