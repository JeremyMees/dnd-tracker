import type { StripeFields } from './stripe'

export type DatabaseTable = keyof Database['public']['Tables']
export type DatabaseEnum = keyof Database['public']['Enums']

// Database Tables
export type ArmorRow = Database['public']['Tables']['armor']['Row']
export type ArmorInsert = Database['public']['Tables']['armor']['Insert']
export type ArmorUpdate = Database['public']['Tables']['armor']['Update']
export type CampaignRow = Database['public']['Tables']['campaigns']['Row']
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update']
export type ConditionRow = Database['public']['Tables']['conditions']['Row']
export type ConditionInsert = Database['public']['Tables']['conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['conditions']['Update']
export type FeatureRow = Database['public']['Tables']['features']['Row']
export type FeatureInsert = Database['public']['Tables']['features']['Insert']
export type FeatureUpdate = Database['public']['Tables']['features']['Update']
export type HomebrewItemRow = Database['public']['Tables']['homebrew_items']['Row']
export type HomebrewItemInsert = Database['public']['Tables']['homebrew_items']['Insert']
export type HomebrewItemUpdate = Database['public']['Tables']['homebrew_items']['Update']
export type InitiativeRow = Database['public']['Tables']['initiative_sheets']['Row']
export type InitiativeInsert = Database['public']['Tables']['initiative_sheets']['Insert']
export type InitiativeUpdate = Database['public']['Tables']['initiative_sheets']['Update']
export type JoinCampaignRow = Database['public']['Tables']['join_campaign']['Row']
export type JoinCampaignInsert = Database['public']['Tables']['join_campaign']['Insert']
export type JoinCampaignUpdate = Database['public']['Tables']['join_campaign']['Update']
export type MagicItemRow = Database['public']['Tables']['magic_items']['Row']
export type MagicItemInsert = Database['public']['Tables']['magic_items']['Insert']
export type MagicItemUpdate = Database['public']['Tables']['magic_items']['Update']
export type MonsterRow = Database['public']['Tables']['monsters']['Row']
export type MonsterInsert = Database['public']['Tables']['monsters']['Insert']
export type MonsterUpdate = Database['public']['Tables']['monsters']['Update']
export type NoteRow = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type SpellRow = Database['public']['Tables']['spells']['Row']
export type SpellInsert = Database['public']['Tables']['spells']['Insert']
export type SpellUpdate = Database['public']['Tables']['spells']['Update']
export type TeamRow = Database['public']['Tables']['team']['Row']
export type TeamInsert = Database['public']['Tables']['team']['Insert']
export type TeamUpdate = Database['public']['Tables']['team']['Update']
export type WeaponRow = Database['public']['Tables']['weapons']['Row']
export type WeaponInsert = Database['public']['Tables']['weapons']['Insert']
export type WeaponUpdate = Database['public']['Tables']['weapons']['Update']

// Database Enums
export type ActionType = Database['public']['Enums']['action_type']
export type Alignment = Database['public']['Enums']['alignment']
export type ArmorCategory = Database['public']['Enums']['armor_category']
export type DamageType = Database['public']['Enums']['damage_type']
export type FeatureRequestStatus = Database['public']['Enums']['feature_request_status']
export type HomebrewType = Database['public']['Enums']['homebrew_type']
export type InitiativePet = Database['public']['Enums']['initiative_pet']
export type MagicItemType = Database['public']['Enums']['magic_item_type']
export type MagicSchool = Database['public']['Enums']['magic_school']
export type MonsterSize = Database['public']['Enums']['monster_size']
export type MonsterType = Database['public']['Enums']['monster_type']
export type ItemRarity = Database['public']['Enums']['rarity']
export type DNDRules = Database['public']['Enums']['rules']
export type SubscriptionType = Database['public']['Enums']['subscription_type']
export type TableSpacing = Database['public']['Enums']['table_spacing']
export type UserRole = Database['public']['Enums']['user_role']
export type WeaponCategory = Database['public']['Enums']['weapon_category']

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
  description: {
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

export type MinimalProfile = Pick<ProfileRow, 'avatar' | 'id' | 'username'>

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
    }
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
