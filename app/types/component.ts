import type { ToastProps } from '~/components/ui/toast'

export interface Toast {
  title: string
  description: string
  variant: ToastProps['variant']
}

export interface ToastItem extends ToastProps {
  title: [string, Record<string, unknown>?]
  description: [string, Record<string, unknown>?]
}

export type ModalComponent
  = | 'FeatureRequest'
    | 'Campaign'
    | 'Encounter'
    | 'TransferOwnership'
    | 'InviteMember'
    | 'Homebrew'
    | 'Note'
    | 'Mail'

export type ModalVariant = 'default' | 'big' | 'fullScreen'

export interface Modal {
  uuid: string
  component: ModalComponent
  header: string
  subHeader?: string
  variant?: ModalVariant
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
