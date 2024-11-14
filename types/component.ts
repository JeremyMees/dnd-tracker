export type ToastType = 'error' | 'warn' | 'info' | 'success'

export interface Toast {
  uuid: string
  timeout: number
  title: string
  text: string
  actions: any[]
  timed: boolean
  type: ToastType
}

export type CreateToast = Partial<Omit<Toast, 'uuid' | 'type'>>

export type ModalComponent = 'FeatureRequest' | 'Badge' | 'Campaign'

export interface Modal {
  uuid: string
  component: ModalComponent
  header: string
  props?: Record<string, any>
}

export interface TableHeader {
  label: string
  sort: boolean
  id: string
}

export interface TableFilters {
  search: string
  sortedBy: string
  sortACS: boolean
}

export type FeatureSortBy = 'voted_most' | 'voted_least' | 'first_new' | 'first_old'

export type FeatureType = 'all' | 'my'

export type FeatureVote = 'like' | 'dislike'

export interface FeatureVotes {
  like: string[]
  dislike: string[]
}

export interface InfoCard {
  name: string
  slug: string
  desc?: string
  category?: string
  ac_string?: string
  strength_requirement?: string
  stealth_disadvantage?: string
  cost?: string
  damage_dice?: string
  damage_type?: string
  weight?: string
  properties?: string[]
  type?: string
  rarity?: string
  requires_attunement?: string
  skill_proficiencies?: string
  tool_proficiencies?: string
  languages?: string
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
