import type { RequireAtLeastOne } from 'type-fest'
import type { DB } from './database'
import type { StripeFields } from './stripe'

export type DatabaseTable = keyof DB['public']['Tables']
export type DatabaseEnum = keyof DB['public']['Enums']

// Database Tables
export type CampaignRow = DB['public']['Tables']['campaigns']['Row']
export type CampaignInsert = DB['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = DB['public']['Tables']['campaigns']['Update']
export type FeatureRow = DB['public']['Tables']['features']['Row']
export type FeatureInsert = DB['public']['Tables']['features']['Insert']
export type FeatureUpdate = DB['public']['Tables']['features']['Update']
export type HomebrewItemRow = DB['public']['Tables']['homebrew_items']['Row']
export type HomebrewItemInsert = DB['public']['Tables']['homebrew_items']['Insert']
export type HomebrewItemUpdate = DB['public']['Tables']['homebrew_items']['Update']
export type InitiativeRow = DB['public']['Tables']['initiative_sheets']['Row']
export type InitiativeInsert = DB['public']['Tables']['initiative_sheets']['Insert']
export type InitiativeUpdate = DB['public']['Tables']['initiative_sheets']['Update']
export type JoinCampaignRow = DB['public']['Tables']['join_campaign']['Row']
export type JoinCampaignInsert = DB['public']['Tables']['join_campaign']['Insert']
export type JoinCampaignUpdate = DB['public']['Tables']['join_campaign']['Update']
export type NoteRow = DB['public']['Tables']['notes']['Row']
export type NoteInsert = DB['public']['Tables']['notes']['Insert']
export type NoteUpdate = DB['public']['Tables']['notes']['Update']
export type ProfileRow = DB['public']['Tables']['profiles']['Row']
export type ProfileInsert = DB['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = DB['public']['Tables']['profiles']['Update']
export type TeamRow = DB['public']['Tables']['team']['Row']
export type TeamInsert = DB['public']['Tables']['team']['Insert']
export type TeamUpdate = DB['public']['Tables']['team']['Update']

// Database Enums
export type FeatureRequestStatus = Database['public']['Enums']['feature_request_status']
export type HomebrewType = Database['public']['Enums']['homebrew_type']
export type InitiativePet = Database['public']['Enums']['initiative_pet']
export type SubscriptionType = Database['public']['Enums']['subscription_type']
export type TableSpacing = Database['public']['Enums']['table_spacing']
export type UserRole = Database['public']['Enums']['user_role']

// Additional Enums
export type InitiativeWidget = 'note' | 'info-pins'
export type InitiativeRowField = 'armorClass' | 'hitPoints' | 'conditions' | 'note' | 'deathSaves' | 'concentration' | 'modify'

export interface InitiativeSheetRow {
  id: string
  index: number
  initiative: number
  name: string
  type: HomebrewType
  conditions: DndCondition[]
  deathSaves?: DndDeathSaves
  concentration?: boolean
  armorClass?: number
  maxArmorClass?: number
  maxArmorClassOld?: number
  tempArmorClass?: number
  hitPoints?: number
  maxHitPoints?: number
  maxHitPointsOld?: number
  tempHitPoints?: number
  initiativeModifier?: number
  campaign?: number
  createdAt?: string
  link?: string
  note?: string
  player?: string
  summoner?: {
    name: string
    id: string
  }
  actions?: DndAction[]
  traits?: DndTrait[]
  hitDice?: string
  armorDetail?: string
  proficiencyBonus?: number
  passivePerception?: number
  speed?: DndSpeed
  sight?: DndSight
  languages?: string[]
  abilityScores?: DndAbilityScores
  modifiers?: DndModifiers
  savingThrows?: DndSavingThrowBonuses
  skillBonuses?: DndSkillBonuses
  resistancesAndImmunities?: DndResistancesAndImmunities
}

export interface InitiativeSheetRowInsert extends Omit<InitiativeSheetRow, 'campaign' | 'amount' | 'initiative' | 'initiativeModifier' | 'summoner' | 'conditions' | 'index' | NotUpdatable> {}

export interface InitiativeSettings {
  spacing: TableSpacing
  modified: boolean
  rows?: InitiativeRowField[]
  widgets?: InitiativeWidget[]
  pet?: InitiativePet
  negative?: boolean
}

// Extended Types
export type NotUpdatable = 'id' | 'createdAt' | 'updated_at'

export type SocialProfile = Required<Omit<ProfileRow, StripeFields | 'marketing' | 'role' | 'avatarOptions'>>

export type MinimalProfile = {
  avatar: string
  id: string
  username: string
}

export type Profile = Pick<ProfileRow, 'avatar' | 'id' | 'username' | 'name' | 'email'>

export type FeatureRequest = Omit<FeatureRow, 'createdBy' | 'voted'> & {
  createdBy: SocialProfile
  voted: FeatureVotes
}

export interface TeamMember extends Omit<TeamRow, 'user' | 'campaign' | 'createdAt'> {
  user: MinimalProfile
}

export interface TeamMemberFull extends Omit<TeamRow, 'user' | 'campaign' | 'createdAt'> {
  user: Profile & { subscriptionType: SubscriptionType }
}

export interface CampaignItem extends Omit<CampaignRow, 'team' | 'createdBy'> {
  initiative_sheets: number
  homebrew_items: number
  createdBy: MinimalProfile
  team: TeamMember[]
}

export interface CampaignMinimal {
  id: number
  title: string
  createdBy: MinimalProfile
  team: TeamMember[]
}

export interface CampaignFull {
  id: number
  title: string
  createdBy: Profile
  team: TeamMemberFull[]
  join_campaign: TeamMemberFull[]
}

export interface JoinCampaignItem extends Pick<JoinCampaignRow, 'user' | 'role' | 'id'> {
  campaign: Pick<CampaignRow, 'id' | 'title'>
}

export interface JoinCampaignKey extends Omit<JoinCampaignRow, 'user'> {
  user: MinimalProfile
}

export interface EncounterItem extends Omit<InitiativeRow, 'createdBy' | 'campaign'> {
  createdBy: MinimalProfile
  campaign: CampaignMinimal
  homebrew_items: number
  initiative_sheets: number
}

export interface InitiativeSheet extends Omit<InitiativeRow, 'campaign'> {
  campaign?: {
    id: CampaignRow['id']
    title: CampaignRow['title']
    createdBy: MinimalProfile
    team: {
      id: TeamRow['id']
      role: TeamRow['role']
      user: MinimalProfile
    }[]
  }
}

// Custom Types
export interface SbQuery<T> {
  data: T[]
  count: number
  totalPages: number
}

export interface SbFetchOptions {
  table: DatabaseTable
  fields?: string[]
  select?: string
  page?: number
  perPage?: number
  filters?: SbFilter
  fuzzy?: boolean
}

export interface SbEq {
  field: string
  value: string | number
}

export interface SbRange {
  from: number
  to: number
}

export type SbFilter = RequireAtLeastOne<{
  search?: string
  sortBy?: string
  sortDesc?: boolean
  page?: number
  eq?: SbEq
}>
