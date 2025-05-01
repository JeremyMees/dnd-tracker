import type { DB } from './database'
import type { StripeFields } from './stripe'

export type DatabaseTable = keyof DB['public']['Tables']
export type DatabaseEnum = keyof DB['public']['Enums']

// Database Tables
export type ArmorRow = DB['public']['Tables']['armor']['Row']
export type ArmorInsert = DB['public']['Tables']['armor']['Insert']
export type ArmorUpdate = DB['public']['Tables']['armor']['Update']
export type CampaignRow = DB['public']['Tables']['campaigns']['Row']
export type CampaignInsert = DB['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = DB['public']['Tables']['campaigns']['Update']
export type ConditionRow = DB['public']['Tables']['conditions']['Row']
export type ConditionInsert = DB['public']['Tables']['conditions']['Insert']
export type ConditionUpdate = DB['public']['Tables']['conditions']['Update']
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
export type MagicItemRow = DB['public']['Tables']['magic_items']['Row']
export type MagicItemInsert = DB['public']['Tables']['magic_items']['Insert']
export type MagicItemUpdate = DB['public']['Tables']['magic_items']['Update']
export type MonsterRow = DB['public']['Tables']['monsters']['Row']
export type MonsterInsert = DB['public']['Tables']['monsters']['Insert']
export type MonsterUpdate = DB['public']['Tables']['monsters']['Update']
export type NoteRow = DB['public']['Tables']['notes']['Row']
export type NoteInsert = DB['public']['Tables']['notes']['Insert']
export type NoteUpdate = DB['public']['Tables']['notes']['Update']
export type ProfileRow = DB['public']['Tables']['profiles']['Row']
export type ProfileInsert = DB['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = DB['public']['Tables']['profiles']['Update']
export type SpellRow = DB['public']['Tables']['spells']['Row']
export type SpellInsert = DB['public']['Tables']['spells']['Insert']
export type SpellUpdate = DB['public']['Tables']['spells']['Update']
export type TeamRow = DB['public']['Tables']['team']['Row']
export type TeamInsert = DB['public']['Tables']['team']['Insert']
export type TeamUpdate = DB['public']['Tables']['team']['Update']
export type WeaponRow = DB['public']['Tables']['weapons']['Row']
export type WeaponInsert = DB['public']['Tables']['weapons']['Insert']
export type WeaponUpdate = DB['public']['Tables']['weapons']['Update']

// Database Enums
export type ActionType = DB['public']['Enums']['action_type']
export type Alignment = DB['public']['Enums']['alignment']
export type ArmorCategory = DB['public']['Enums']['armor_category']
export type DamageType = DB['public']['Enums']['damage_type']
export type FeatureRequestStatus = DB['public']['Enums']['feature_request_status']
export type HomebrewType = DB['public']['Enums']['homebrew_type']
export type InitiativePet = DB['public']['Enums']['initiative_pet']
export type MagicItemType = DB['public']['Enums']['magic_item_type']
export type MagicSchool = DB['public']['Enums']['magic_school']
export type MonsterSize = DB['public']['Enums']['monster_size']
export type MonsterType = DB['public']['Enums']['monster_type']
export type ItemRarity = DB['public']['Enums']['rarity']
export type DNDRules = DB['public']['Enums']['rules']
export type SubscriptionType = DB['public']['Enums']['subscription_type']
export type TableSpacing = DB['public']['Enums']['table_spacing']
export type UserRole = DB['public']['Enums']['user_role']
export type WeaponCategory = DB['public']['Enums']['weapon_category']

// Database json schema types
export interface Action {
  name: string
  desc: string
  type: ActionType
  attack_bonus?: number
  damage_bonus?: number
  damage_dice?: string
}

export interface ActionOpen5E {
  name: string
  desc: {
    en: string
  }
  attack_bonus?: number
  damage_bonus?: number
  damage_dice?: string
}

export interface DeathSaves {
  fail: [boolean, boolean, boolean]
  save: [boolean, boolean, boolean]
}

export interface InitiativeSheetRow {
  id: string
  index: number
  initiative: number
  name: string
  type: HomebrewType
  conditions: {
    name: string
    desc: string
    level?: number
    hasLevels?: boolean
  }[]
  deathSaves?: DeathSaves
  concentration?: boolean
  ac?: number
  maxAc?: number
  maxAcOld?: number
  tempAc?: number
  health?: number
  maxHealth?: number
  maxHealthOld?: number
  tempHealth?: number
  initiative_modifier?: number
  campaign?: number
  link?: string
  note?: string
  armor_class?: string
  hit_points?: string
  summoner?: {
    name: string
    id: string
  }
  actions?: (Action | ActionOpen5E)[]
  reactions?: (Action | ActionOpen5E)[]
  legendary_actions?: (Action | ActionOpen5E)[]
  special_abilities?: (Action | ActionOpen5E)[]
}

export interface InitiativeSheetRowInsert extends Omit<InitiativeSheetRow, 'campaign' | 'amount' | 'initiative' | 'initiative_modifier' | 'summoner' | NotUpdatable> {
  actions?: Action[]
  reactions?: Action[]
  legendary_actions?: Action[]
  special_abilities?: Action[]
}

export interface InitiativeSettings {
  spacing: TableSpacing
  modified: boolean
  rows?: string[]
  widgets?: string[]
  pet?: InitiativePet
}

// Extended Types
export type NotUpdatable = 'id' | 'created_at' | 'updated_at'

export type SocialProfile = Required<Omit<ProfileRow, StripeFields | 'marketing' | 'role' | 'avatar_options'>>

export type MinimalProfile = {
  avatar: string
  id: string
  username: string
}

export type Profile = Pick<ProfileRow, 'avatar' | 'id' | 'username' | 'name' | 'email'>

export type FeatureRequest = Omit<FeatureRow, 'created_by' | 'voted'> & {
  created_by: SocialProfile
  voted: FeatureVotes
}

export interface TeamMember extends Omit<TeamRow, 'user' | 'campaign' | 'created_at'> {
  user: MinimalProfile
}

export interface TeamMemberFull extends Omit<TeamRow, 'user' | 'campaign' | 'created_at'> {
  user: Profile
}

export interface CampaignItem extends Omit<CampaignRow, 'team' | 'created_by'> {
  initiative_sheets: number
  homebrew_items: number
  created_by: MinimalProfile
  team: TeamMember[]
}

export interface CampaignMinimal {
  id: number
  title: string
  created_by: MinimalProfile
  team: TeamMember[]
}

export interface CampaignFull {
  id: number
  title: string
  created_by: Profile
  team: TeamMemberFull[]
  join_campaign: TeamMemberFull[]
}

export interface JoinCampaignItem extends Pick<JoinCampaignRow, 'user' | 'role' | 'id'> {
  campaign: Pick<CampaignRow, 'id' | 'title'>
}

export interface JoinCampaignKey extends Omit<JoinCampaignRow, 'user'> {
  user: MinimalProfile
}

export interface EncounterItem extends Omit<InitiativeRow, 'created_by' | 'campaign'> {
  created_by: MinimalProfile
  campaign: CampaignMinimal
  homebrew_items: number
  initiative_sheets: number
}

export interface InitiativeSheet extends Omit<InitiativeRow, 'campaign'> {
  campaign?: {
    id: CampaignRow['id']
    title: CampaignRow['title']
    created_by: MinimalProfile
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

export interface SbFilter {
  search: string
  sortBy?: string
  sortDesc?: boolean
  page?: number
  eq?: SbEq
}
