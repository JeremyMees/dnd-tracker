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

export type ModalComponent =
  | 'FeatureRequest'
  | 'Campaign'
  | 'Encounter'
  | 'TransferOwnership'
  | 'InviteMember'
  | 'Homebrew'
  | 'Note'
  | 'Mail'
  | 'InitiativeSettings'
  | 'InitiativeRowName'
  | 'DiceRoll'

export interface Modal {
  uuid: string
  component: ModalComponent
  header: string
  submit?: string
  subHeader?: string
  big?: boolean
  props?: Record<string, any>
  events?: Record<string, (...args: any[]) => any>
}

export interface TableHeader {
  label: string
  sort: boolean
  id: string
}

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

export interface Tab {
  link: string
  label: string
  icon: string
  disabled?: boolean
}
