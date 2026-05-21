export type Open5eType
  = | 'spells'
    | 'monsters'
    | 'conditions'
    | 'magicitems'
    | 'weapons'
    | 'armor'
    | 'documents'

export type Open5eSortBy
  = | 'name'
    | 'hit_points'
    | '-hit_points'
    | 'armor_class'
    | '-armor_class'
    | 'challenge_rating'
    | '-challenge_rating'

export interface Open5eFilters {
  page: number
  limit?: number
  name__icontains?: string
  cr?: number
  ordering?: Open5eSortBy
  document__key__in?: string
}

interface Open5eInfoObject<T = string> {
  name: string
  key: T
  url: string
}

export interface Open5eResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Open5eItem
  = | Open5eSpell
    | Open5eMagicItem
    | Open5eWeapon
    | Open5eArmor
    | Open5eCondition
    | Open5eMonster

export interface Open5eMinimalDocument {
  name: string
  key: string
  type: string
  display_name: string
  publisher: Open5eInfoObject
  gamesystem: Open5eInfoObject<Open5eGameSystem>
  permalink: string
}

export interface Open5eSpellCastingOption {
  type: string
  damage_roll: string | null
  target_count: number | null
  duration: string | null
  range: number | null
  concentration: boolean | null
  shape_size: number | null
  desc?: string | null
}

export type Open5eSpeed = Partial<DndSpeed> & {
  unit: 'feet'
  walk: number
}

export interface Open5eLanguages {
  as_string: string
  data: Open5eLanguage[]
}

export interface Open5eLanguage {
  name: string
  key: string
  url: string
  desc: string
}

export interface Open5eResistancesAndImmunities {
  damage_immunities_display: string
  damage_immunities: Open5eInfoObject[]
  damage_resistances_display: string
  damage_resistances: Open5eInfoObject[]
  damage_vulnerabilities_display: string
  damage_vulnerabilities: Open5eInfoObject[]
  condition_immunities_display: string
  condition_immunities: Open5eInfoObject[]
}

export type Open5eActionType = 'ACTION'
  | 'BONUS_ACTION'
  | 'REACTION'
  | 'LEGENDARY_ACTION'
  | 'MYTHIC_ACTION'
  | 'LAIR_ACTION'

export interface Open5eAction {
  name: string
  desc: string
  attacks: Open5eAttack[]
  action_type: Open5eActionType
  order_in_statblock: number | null
  legendary_action_cost: number | null
  limited_to_form: string | null
  usage_limits: Open5eUsageLimits | null
}

export interface Open5eAttack {
  name: string
  attack_type: string
  to_hit_mod: number
  reach: number | null
  range: number | null
  long_range: number | null
  target_creature_only: boolean
  damage_die_count: number | null
  damage_die_type: string | null
  damage_bonus: number | null
  damage_type: Open5eInfoObject | null
  extra_damage_die_count: number | null
  extra_damage_die_type: string | null
  extra_damage_bonus: number | null
  extra_damage_type: Open5eInfoObject | null
  distance_unit: string
}

export interface Open5eUsageLimits {
  type: string
  param: number
}

export interface Open5eTrait {
  name: string
  desc: string
}

export interface Open5eSpell extends Open5eInfoObject {
  document: Open5eMinimalDocument
  casting_options: Open5eSpellCastingOption[]
  school: Open5eInfoObject
  classes: Open5eInfoObject[]
  range_unit: string
  shape_size_unit: string
  desc: string
  level: number
  higher_level: string
  target_type: string
  range_text: string
  range: number
  ritual: boolean
  casting_time: string
  reaction_condition: string | null
  verbal: boolean
  somatic: boolean
  material: boolean
  material_specified: string
  material_cost: number | null
  material_consumed: boolean
  target_count: number
  saving_throw_ability: string
  attack_roll: boolean
  damage_roll: string
  damage_types: string[]
  duration: string
  shape_type: string | null
  shape_size: number | null
  concentration: boolean
}

interface Open5eArmorStats extends Open5eInfoObject {
  category: string
  ac_base: number
  ac_display: string
  ac_add_dexmod: boolean
  ac_cap_dexmod: number | null
  grants_stealth_disadvantage: boolean
  strength_score_required: number | null
}

export interface Open5eMagicItem extends Open5eInfoObject {
  desc: string
  category: Open5eInfoObject
  rarity: Open5eInfoObject & { rank: number }
  is_magic_item: boolean
  weapon: Open5eWeapon | null
  armor: Open5eArmorStats | null
  size: Open5eInfoObject
  weight: string
  weight_unit: string
  cost: string
  requires_attunement: boolean
  attunement_detail: string | null
  document: Open5eMinimalDocument
}

interface Open5eWeaponProperty {
  property: {
    name: string
    type: string | null
    url: string
    desc: string
  }
  detail: string | null
}

export interface Open5eWeapon extends Open5eInfoObject {
  document: Open5eMinimalDocument
  properties: Open5eWeaponProperty[]
  damage_type: Open5eInfoObject
  distance_unit: string
  damage_dice: string
  range: number
  long_range: number
  is_simple: boolean
  is_improvised: boolean
}

export interface Open5eArmor extends Open5eInfoObject {
  ac_display: string
  category: string
  document: Open5eMinimalDocument
  grants_stealth_disadvantage: boolean
  strength_score_required: number | null
  ac_base: number
  ac_add_dexmod: boolean
  ac_cap_dexmod: number | null
}

export interface Open5eMonster extends Open5eInfoObject {
  document: Open5eMinimalDocument
  type: Open5eInfoObject
  size: Open5eInfoObject
  challenge_rating: number
  proficiency_bonus: number | null
  speed: Partial<DndSpeed>
  speed_all: DndSpeed
  category: string
  subcategory: string | null
  alignment: string
  languages: Open5eLanguages
  armor_class: number
  armor_detail: string
  hit_points: number
  hit_dice: string
  experience_points: number
  ability_scores: DndAbilityScores
  modifiers: DndModifiers
  initiative_bonus: number
  saving_throws: Partial<DndSavingThrowBonuses>
  saving_throws_all: DndSavingThrowBonuses
  skill_bonuses: Record<string, number>
  skill_bonuses_all: Record<string, number>
  passive_perception: number
  resistances_and_immunities: Open5eResistancesAndImmunities
  normal_sight_range: number | null
  darkvision_range: number | null
  blindsight_range: number | null
  tremorsense_range: number | null
  truesight_range: number | null
  actions: Open5eAction[]
  traits: Open5eTrait[]
  creaturesets: unknown[]
  environments: unknown[]
  illustration: string | null
}

export interface Open5eConditionDescription {
  desc: string
  document: string
  gamesystem: string
}

export interface Open5eCondition extends Open5eInfoObject {
  descriptions: Open5eConditionDescription[]
  document: Open5eMinimalDocument
}

export type Open5eGameSystem = '5e-2014' | '5e-2024' | 'a5e'

export interface Open5eDocument extends Open5eInfoObject {
  licenses: Open5eInfoObject[]
  publisher: Open5eInfoObject
  gamesystem: Open5eInfoObject<Open5eGameSystem>
  display_name: string
  desc: string
  type: string
  author: string
  publication_date: string
  permalink: string
  distance_unit: string
  weight_unit: string
}

export interface Open5eEndpointMap {
  spells: Open5eSpell
  monsters: Open5eMonster
  conditions: Open5eCondition
  magicitems: Open5eMagicItem
  weapons: Open5eWeapon
  armor: Open5eArmor
  documents: Open5eDocument
}

export interface Open5eV1Action {
  name: string
  desc: string
  attack_bonus?: number
  damage_bonus?: number
  damage_dice?: string
}

export interface Open5eV1Item {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  actions: Open5eV1Action[]
  legendary_actions: Open5eV1Action[]
  reactions: Open5eV1Action[]
  special_abilities: Open5eV1Action[]
  slug: string
  desc: string
  name: string
  size: string
  type: Open5eType
  subtype: string
  group: string | null
  alignment: string
  armor_class: number
  armor_desc: string
  hit_points: number
  hit_dice: string
  speed: Record<string, number>
  strength_save: string | null
  dexterity_save: string | null
  constitution_save: number
  intelligence_save: number
  wisdom_save: number
  charisma_save: string | null
  perception: number
  skills: Record<string, number>
  damage_vulnerabilities: string
  damage_resistances: string
  damage_immunities: string
  condition_immunities: string
  senses: string
  languages: string
  challenge_rating: string
  cr: number
  legendary_desc: string
  page_no: number
  environments: string[]
  img_main: string
  document__slug: string
  document__title: string
  document__license_url: string
  document__url: string
  xp?: number
  category?: string
  ac_string?: string
  strength_requirement?: string
  stealth_disadvantage?: string
  cost?: string
  damage_dice?: string
  damage_type?: string
  weight?: string
  properties?: string[]
  rarity?: string
  requires_attunement?: string
  skill_proficiencies?: string
  tool_proficiencies?: string
  equipment?: string
  feature?: string
  feature_desc?: string
  level?: string
  higher_level?: string
  casting_time?: string
  range?: string
  duration?: string
  concentration?: string
  ritual?: string
  components?: string
  material?: string
  school?: string
  dnd_class?: string
  prerequisite?: string
  effects_desc?: string[]
}

export type Open5eListingResult
  = | { type: 'spells', items: DndSpell[], pages: number }
    | { type: 'monsters', items: DndMonster[], pages: number }
    | { type: 'conditions', items: DndCondition[], pages: number }
    | { type: 'magicitems', items: DndMagicItem[], pages: number }
    | { type: 'weapons', items: DndWeapon[], pages: number }
    | { type: 'armor', items: DndArmor[], pages: number }
