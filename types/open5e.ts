export type Open5eType =
  | 'spells'
  | 'monsters'
  | 'backgrounds'
  | 'planes'
  | 'feats'
  | 'conditions'
  | 'races'
  | 'classes'
  | 'magicitems'
  | 'weapons'
  | 'armor'
  | 'documents'
  | 'sections'

export type Open5eSortBy =
  | 'name'
  | 'hit_points'
  | '-hit_points'
  | 'armor_class'
  | '-armor_class'
  | 'cr'
  | '-cr'

export interface Open5eFilters {
  page: number
  limit?: number
  search?: string
  cr?: number
  ordering?: Open5eSortBy
  document__slug?: string
}

export interface Open5eItem {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  actions: Action[]
  legendary_actions: Action[]
  reactions: Action[]
  special_abilities: Action[]
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

export interface Open5eResponse {
  count: number
  next: string | null
  previous: string | null
  results: Open5eItem[]
}
