import type { JwtPayload } from '@supabase/supabase-js'

export interface SessionUser {
  id: string
  email?: string
  claims: JwtPayload
}

export interface CampaignAccess {
  id: number
  title: string
  createdBy: string
  role: UserRole
}

export interface EncounterAccess {
  id: number
  campaign: number | null
  createdBy: string
}
