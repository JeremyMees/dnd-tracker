import type { MergeDeep } from 'type-fest'
import type { Database } from './database-generated'

interface HomebrewItemOverride {
  actions: DndAction[]
  abilityScores: DndAbilityScores | null
  modifiers: DndModifiers | null
  savingThrows: DndSavingThrowBonuses | null
  skillBonuses: DndSkillBonuses | null
  speed: DndSpeed | null
  sight: DndSight | null
  languages: string[] | null
  resistancesAndImmunities: DndResistancesAndImmunities | null
  traits: DndTrait[] | null
}

interface HomebrewItemInsertOverride {
  actions: DndAction[]
  abilityScores?: DndAbilityScores | null
  modifiers?: DndModifiers | null
  savingThrows?: DndSavingThrowBonuses | null
  skillBonuses?: DndSkillBonuses | null
  speed?: DndSpeed | null
  sight?: DndSight | null
  languages?: string[] | null
  resistancesAndImmunities?: DndResistancesAndImmunities | null
  traits?: DndTrait[] | null
}

interface SrdMonsterOverride {
  type: DndMonsterType
  size: DndSize
  alignment: DndAlignment
  hitDice: DndHitDice
  speed: DndSpeed
  sight: DndSight
  languages: DndLanguage[]
  abilityScores: DndAbilityScores
  modifiers: DndModifiers
  savingThrows: DndSavingThrowBonuses
  skillBonuses: DndSkillBonuses
  resistancesAndImmunities: DndResistancesAndImmunities
  actions: DndAction[]
  traits: DndTrait[]
}

interface SrdMonsterInsertOverride extends Omit<
  SrdMonsterOverride,
  'languages' | 'actions' | 'traits'
> {
  languages?: DndLanguage[]
  actions?: DndAction[]
  traits?: DndTrait[]
}

interface SrdSpellOverride {
  school: DndSpellSchool
  classes: DndClass[]
  damageTypes: DndDamageType[]
  rangeUnit: DndDistanceUnit
  shapeSizeUnit: DndDistanceUnit
  shapeType: DndShapeType | null
  savingThrowAbility: DndAbility
  castingOptions: DndSpellCastingOption[]
}

interface SrdSpellInsertOverride extends Omit<
  SrdSpellOverride,
  'classes' | 'damageTypes' | 'castingOptions'
> {
  classes?: DndClass[]
  damageTypes?: DndDamageType[]
  castingOptions?: DndSpellCastingOption[]
}

interface SrdMagicItemOverride {
  type: DndMagicItemType
  size: DndSize
  weightUnit: DndWeightUnit
  rarity: DndRarity
  weapon: DndWeapon | null
  armor: DndArmor | null
}

interface SrdWeaponOverride {
  damageType: DndDamageType
  distanceUnit: DndDistanceUnit
  properties: DndWeaponProperty[]
}

interface SrdArmorOverride {
  type: DndArmorType
}

interface DatabaseOverrides {
  public: {
    Tables: {
      srd_monsters: {
        Row: SrdMonsterOverride
        Insert: SrdMonsterInsertOverride
        Update: Partial<SrdMonsterOverride>
      }
      srd_spells: {
        Row: SrdSpellOverride
        Insert: SrdSpellInsertOverride
        Update: Partial<SrdSpellOverride>
      }
      srd_magic_items: {
        Row: SrdMagicItemOverride
        Insert: SrdMagicItemOverride
        Update: Partial<SrdMagicItemOverride>
      }
      srd_weapons: {
        Row: SrdWeaponOverride
        Insert: Omit<SrdWeaponOverride, 'properties'> & {
          properties?: DndWeaponProperty[]
        }
        Update: Partial<SrdWeaponOverride>
      }
      srd_armor: {
        Row: SrdArmorOverride
        Insert: SrdArmorOverride
        Update: Partial<SrdArmorOverride>
      }
      homebrew_items: {
        Row: HomebrewItemOverride
        Insert: HomebrewItemInsertOverride
        Update: Partial<HomebrewItemOverride>
      }
      initiative_sheets: {
        Row: {
          rows: InitiativeSheetRow[]
          settings: InitiativeSettings
          infoCards: DndItem[]
        }
        Insert: {
          rows: InitiativeSheetRow[]
          settings?: InitiativeSettings
          infoCards?: DndItem[]
        }
        Update: {
          rows?: InitiativeSheetRow[]
          settings?: InitiativeSettings
          infoCards?: DndItem[]
        }
      }
      profiles: {
        Row: {
          avatarOptions?: Record<string, string | number>
        }
        Insert: {
          avatarOptions?: Record<string, string | number>
        }
        Update: {
          avatarOptions?: Record<string, string | number>
        }
      }
      live_sessions: {
        Row: {
          seats: LiveSeat[]
        }
        Insert: {
          seats?: LiveSeat[]
        }
        Update: {
          seats?: LiveSeat[]
        }
      }
    }
    Functions: {
      claim_live_seat: {
        Args: {
          p_session: string
          p_row: string | null
          p_name: string
          p_spectator: boolean
        }
        Returns: LiveSeat
      }
      apply_live_action: {
        Args: {
          p_encounter: number
          p_row_id: string
          p_patch: Partial<InitiativeSheetRow>
        }
        Returns: InitiativeSheetRow
      }
      increment_live_version: {
        Args: {
          p_session: string
        }
        Returns: number
      }
      remove_live_seat: {
        Args: {
          p_session: string
          p_seat: string
        }
        Returns: { seat: string }
      }
      reassign_live_seat: {
        Args: {
          p_session: string
          p_seat: string
          p_row: string
        }
        Returns: LiveSeat
      }
    }
  }
}

// Override the Json type with more specific types that are the same as the json schema
export type DB = MergeDeep<Database, DatabaseOverrides>
