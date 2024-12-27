import type { FormKitNode } from '@formkit/core'

export type FormNode = FormKitNode

export interface Login {
  email: string
  password: string
}

export interface Register extends Login {
  username: string
  name: string
  marketing: boolean
  avatar: Avatar['url']
  avatar_options: Avatar['extra']
}

export interface ForgotPassword {
  email: string
}

export interface ResetPassword {
  password: string
}

export interface Contact {
  name?: string
  email: string
  question: string
}

export interface BadgeClaim {
  code: string
}

export interface FeatureForm {
  title: string
  text: string
}

export interface CampaignForm {
  title: string
}

export interface EncounterForm {
  title: string
  campaign?: number
}

export interface TransformForm {
  title: string
  role: UserRole | 'Remove'
  user: string
}

export interface UpdateRoleForm {
  role: UserRole
  id: string
}

export interface AddMemberForm {
  role: UserRole
  id: string
  profile: Profile
}

export interface InviteMemberForm {
  users: AddMemberForm[]
}

export interface HomebrewItemForm extends Omit<HomebrewItemInsert, 'campaign' | NotUpdatable> {
  amount?: number
  initiative?: number
  summoner?: string
  save?: boolean
}

export interface NoteForm {
  title: string
  text: string
}

export interface MailForm {
  mail: string[]
}
