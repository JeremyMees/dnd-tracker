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

export interface Tab {
  link: string
  label: string
  icon: string
  disabled?: boolean
}
