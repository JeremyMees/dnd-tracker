export type DndDice = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'

export type DndDiceSide = 4 | 6 | 8 | 10 | 12 | 20 | 100

export type DndHpType = 'heal' | 'damage' | 'temp' | 'override' | 'override-reset'

export type DndAcType = 'add' | 'remove' | 'temp' | 'override' | 'override-reset'

export type DndRace = 'human' | 'elf' | 'dwarf' | 'halfling' | 'dragonborn' | 'gnome' | 'half-elf' | 'half-orc' | 'tiefling'

export type DndGender = 'male' | 'female' | 'nonbinary'

export type DndDistanceUnit = 'feet' | 'miles'

export type DndWeightUnit = 'pounds' | 'tons'

export type DndSkill
  = | 'acrobatics'
    | 'animalHandling'
    | 'arcana'
    | 'athletics'
    | 'deception'
    | 'history'
    | 'insight'
    | 'intimidation'
    | 'investigation'
    | 'medicine'
    | 'nature'
    | 'perception'
    | 'performance'
    | 'persuasion'
    | 'religion'
    | 'sleightOfHand'
    | 'stealth'
    | 'survival'

export type DndDamageType
  = | 'acid'
    | 'bludgeoning'
    | 'cold'
    | 'fire'
    | 'force'
    | 'lightning'
    | 'necrotic'
    | 'piercing'
    | 'poison'
    | 'psychic'
    | 'radiant'
    | 'slashing'
    | 'thunder'

export type DndArmorType
  = | 'light'
    | 'medium'
    | 'heavy'

export type DndMagicItemType
  = | 'armor'
    | 'potion'
    | 'ring'
    | 'rod'
    | 'scroll'
    | 'staff'
    | 'wand'
    | 'weapon'
    | 'wondrousItem'

export type DndMonsterType
  = | 'aberration'
    | 'beast'
    | 'celestial'
    | 'construct'
    | 'dragon'
    | 'elemental'
    | 'fey'
    | 'fiend'
    | 'giant'
    | 'humanoid'
    | 'monstrosity'
    | 'ooze'
    | 'plant'
    | 'undead'

export type DndSize
  = | 'tiny'
    | 'small'
    | 'medium'
    | 'large'
    | 'huge'
    | 'gargantuan'

export type DndSkillBonuses = Record<DndSkill, number>

export type DndAbility
  = | 'strength'
    | 'dexterity'
    | 'constitution'
    | 'intelligence'
    | 'wisdom'
    | 'charisma'

export type DndAlignment
  = | 'lawfulGood'
    | 'neutralGood'
    | 'chaoticGood'
    | 'lawfulNeutral'
    | 'trueNeutral'
    | 'chaoticNeutral'
    | 'lawfulEvil'
    | 'neutralEvil'
    | 'chaoticEvil'

export type DndAbilityScores = Record<DndAbility, number>

export type DndModifiers = Record<DndAbility, number>

export type DndSavingThrowBonuses = Record<DndAbility, number>

export type DndConditionType
  = | 'blinded'
    | 'charmed'
    | 'deafened'
    | 'frightened'
    | 'grappled'
    | 'incapacitated'
    | 'invisible'
    | 'paralyzed'
    | 'petrified'
    | 'poisoned'
    | 'prone'
    | 'restrained'
    | 'stunned'
    | 'unconscious'
    | 'exhaustion'

export type DndActionType = 'action'
  | 'bonusAction'
  | 'reaction'
  | 'legendaryAction'
  | 'mythicAction'
  | 'lairAction'
  | 'specialAbility'

export type DndAttackType
  = | 'melee'
    | 'ranged'
    | 'meleeSpell'
    | 'rangedSpell'

export type DndSpellSchool
  = | 'abjuration'
    | 'conjuration'
    | 'divination'
    | 'enchantment'
    | 'evocation'
    | 'illusion'
    | 'necromancy'
    | 'transmutation'

export type DndUsageType
  = | 'perDay'
    | 'recharge'
    | 'atWill'
    | 'perRest'

export type DndClass
  = | 'barbarian'
    | 'bard'
    | 'cleric'
    | 'druid'
    | 'fighter'
    | 'monk'
    | 'paladin'
    | 'ranger'
    | 'rogue'
    | 'sorcerer'
    | 'warlock'
    | 'wizard'

export type DndShapeType
  = | 'cone'
    | 'cube'
    | 'cylinder'
    | 'line'
    | 'sphere'

export type DndSpeedType
  = | 'walk'
    | 'crawl'
    | 'hover'
    | 'fly'
    | 'burrow'
    | 'climb'
    | 'swim'

export type DndSightRangeType
  = | 'normalSightRange'
    | 'darkVisionRange'
    | 'blindSightRange'
    | 'tremorSenseRange'
    | 'trueSightRange'

export type DndResistanceType
  = | 'damageImmunities'
    | 'damageResistances'
    | 'damageVulnerabilities'
    | 'conditionImmunities'

export interface DndSpeed {
  unit: DndDistanceUnit
  walk: number
  crawl?: number
  hover?: boolean
  fly?: number
  burrow?: number
  climb?: number
  swim?: number
}

export interface DndSight {
  normalSightRange: number
  darkVisionRange?: number
  blindSightRange?: number
  tremorSenseRange?: number
  trueSightRange?: number
}

export interface DndSpellCastingOption {
  type: string
  damageRoll?: string
  targetCount?: number
  duration?: string
  range?: number
  concentration?: boolean
  shapeSize?: number
  desc?: string
}

export interface DndLanguage {
  name: string
  desc: string
}

export interface DndResistancesAndImmunities {
  damageImmunities: DndDamageType[]
  damageResistances: DndDamageType[]
  damageVulnerabilities: DndDamageType[]
  conditionImmunities: DndConditionType[]
}

export interface DndDeathSaves {
  fail: [boolean, boolean, boolean]
  save: [boolean, boolean, boolean]
}

export interface DndAction {
  name: string
  desc: string
  attacks: DndAttack[]
  actionType: DndActionType
  legendaryActionCost?: number
  limitedToForm?: string
  usageLimits?: DndUsageLimits
}

export interface DndAttack {
  name: string
  attackType: DndAttackType
  toHitMod: number
  reach?: number
  range?: number
  longRange?: number
  targetCreatureOnly?: boolean
  damageDieCount?: number
  damageDieType?: DndDice
  damageBonus?: number
  damageType?: DndDamageType
  extraDamageDieCount?: number
  extraDamageDieType?: DndDice
  extraDamageBonus?: number
  extraDamageType?: DndDamageType
  distanceUnit: DndDistanceUnit
  spellSave?: number
  spellSaveType?: DndAbility
}

export interface DndUsageLimits {
  type: DndUsageType
  param: number
}

export interface DndTrait {
  name: string
  desc: string
}

export interface DndSpell {
  name: string
  id: string
  castingOptions: DndSpellCastingOption[]
  school: DndSpellSchool
  classes: DndClass[]
  rangeUnit: DndDistanceUnit
  shapeSizeUnit: DndDistanceUnit
  desc: string
  level: number
  higherLevel: string
  targetType: string
  rangeText: string
  range: number
  ritual: boolean
  castingTime: string
  reactionCondition?: string
  verbal: boolean
  somatic: boolean
  material: boolean
  materialSpecified: string
  materialCost?: number
  materialConsumed: boolean
  targetCount: number
  savingThrowAbility: DndAbility
  attackRoll: boolean
  damageRoll: string
  damageTypes: DndDamageType[]
  duration: string
  shapeType?: DndShapeType
  shapeSize?: number
  concentration: boolean
}

export interface DndRarity {
  name: string
  rank: number
}

export interface DndMagicItem {
  name: string
  id: string
  desc: string
  type: DndMagicItemType
  rarity: DndRarity
  isMagicItem: boolean
  weapon?: DndWeapon
  armor?: DndArmor
  size: DndSize
  weight: number
  weightUnit: DndWeightUnit
  cost: string
  requiresAttunement: boolean
  attunementDetail?: string
}

export interface DndWeaponProperty {
  property: {
    name: string
    type?: string
    desc: string
  }
  detail?: string
}

export interface DndWeapon {
  name: string
  id: string
  properties: DndWeaponProperty[]
  damageType: DndDamageType
  distanceUnit: DndDistanceUnit
  damageDice: string
  range: number
  longRange: number
  isSimple: boolean
  isImprovised: boolean
}

export interface DndArmor {
  name: string
  id: string
  acDisplay: string
  type: DndArmorType
  grantsStealthDisadvantage: boolean
  strengthScoreRequired?: number
  acBase: number
  acAddDexMod: boolean
  acCapDexMod?: number
}

export interface DndHitDice {
  hitDiceCount: number
  hitDiceType: DndDice
  hitDiceBonus?: number
}

export interface DndMonster {
  name: string
  id: string
  type: DndMonsterType
  size: DndSize
  challengeRating: number
  proficiencyBonus?: number
  speed: DndSpeed
  alignment: DndAlignment
  languages: DndLanguage[]
  armorClass: number
  armorDetail: string
  hitPoints: number
  hitDice: DndHitDice
  experiencePoints: number
  abilityScores: DndAbilityScores
  modifiers: DndModifiers
  initiativeBonus: number
  savingThrows: DndSavingThrowBonuses
  skillBonuses: DndSkillBonuses
  passivePerception: number
  resistancesAndImmunities: DndResistancesAndImmunities
  sight: DndSight
  actions: DndAction[]
  traits: DndTrait[]
}

export interface DndCreatureStats {
  savingThrows?: DndSavingThrowBonuses | null
  speed?: DndSpeed | null
  sight?: DndSight | null
  skillBonuses?: DndSkillBonuses | null
  resistancesAndImmunities?: DndResistancesAndImmunities | null
  languages?: DndLanguage[] | string[] | null
  traits?: DndTrait[] | null
}

export interface DndCondition {
  name: string
  id: string
  desc: string
  level?: number
  hasLevels?: boolean
}

export type DndItem
  = | DndSpell
    | DndMagicItem
    | DndWeapon
    | DndArmor
    | DndCondition
    | DndMonster
