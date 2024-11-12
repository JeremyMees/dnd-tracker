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
  limit: number
  page: number
  search?: string
  cr?: string
  ordering?: Open5eSortBy
  document__slug?: string
}

export interface Open5eItem extends PossibleAttacks, Abilities {
  slug: string
  desc: string
  name: string
  size: string
  type: string
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
}

export interface Open5eResponse {
  count: number
  next: string | null
  previous: string | null
  results: Open5eItem[]
}
