export type ModalComponent =
  | 'FeatureRequest'
  | 'Campaign'
  | 'Encounter'
  | 'TransferOwnership'
  | 'InviteMember'
  | 'Homebrew'
  | 'Note'
  | 'Mail'
  | 'BugReport'

export type ModalVariant = 'default' | 'big' | 'fullScreen'

export interface Modal {
  uuid: string
  component: ModalComponent
  header: string
  subHeader?: string
  variant?: ModalVariant
  props?: Record<string, unknown>
  events?: Record<string, (...args: never[]) => void>
  closing?: boolean
}
