export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '10.2.0 (e07807d)'
  }
  public: {
    Tables: {
      armor: {
        Row: {
          base_ac: number
          campaign: number | null
          category: Database['public']['Enums']['armor_category']
          cost: string | null
          created_at: string
          created_by: string | null
          id: number
          name: string
          plus_con_mod: boolean
          plus_dex_mod: boolean
          plus_flat_mod: number | null
          plus_max: number | null
          plus_wis_mod: boolean
          rules: Database['public']['Enums']['rules']
          stealth_disadvantage: boolean
          strength_requirement: number | null
          weight: string | null
        }
        Insert: {
          base_ac: number
          campaign?: number | null
          category: Database['public']['Enums']['armor_category']
          cost?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          name: string
          plus_con_mod?: boolean
          plus_dex_mod?: boolean
          plus_flat_mod?: number | null
          plus_max?: number | null
          plus_wis_mod?: boolean
          rules?: Database['public']['Enums']['rules']
          stealth_disadvantage?: boolean
          strength_requirement?: number | null
          weight?: string | null
        }
        Update: {
          base_ac?: number
          campaign?: number | null
          category?: Database['public']['Enums']['armor_category']
          cost?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string
          plus_con_mod?: boolean
          plus_dex_mod?: boolean
          plus_flat_mod?: number | null
          plus_max?: number | null
          plus_wis_mod?: boolean
          rules?: Database['public']['Enums']['rules']
          stealth_disadvantage?: boolean
          strength_requirement?: number | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'armor_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'armor_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      badges: {
        Row: {
          background: string
          code: string | null
          color: string
          created_at: string
          description: Json
          icon: string
          id: number
          label: Json
        }
        Insert: {
          background: string
          code?: string | null
          color: string
          created_at?: string
          description: Json
          icon: string
          id?: number
          label: Json
        }
        Update: {
          background?: string
          code?: string | null
          color?: string
          created_at?: string
          description?: Json
          icon?: string
          id?: number
          label?: Json
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string | null
          created_by: string
          id: number
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: number
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      conditions: {
        Row: {
          campaign: number | null
          created_at: string
          created_by: string | null
          description: string
          id: number
          name: string
          rules: Database['public']['Enums']['rules']
        }
        Insert: {
          campaign?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: number
          name: string
          rules?: Database['public']['Enums']['rules']
        }
        Update: {
          campaign?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: number
          name?: string
          rules?: Database['public']['Enums']['rules']
        }
        Relationships: [
          {
            foreignKeyName: 'conditions_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conditions_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      features: {
        Row: {
          created_at: string
          created_by: string
          id: number
          status: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text: string
          title: string
          voted?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: number
          status?: Database['public']['Enums']['feature_request_status']
          text?: string
          title?: string
          voted?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'features_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      homebrew_items: {
        Row: {
          ac: number | null
          actions: Json
          campaign: number
          created_at: string
          health: number | null
          id: number
          initiative_modifier: string | null
          legendary_actions: Json
          link: string | null
          name: string
          player: string | null
          reactions: Json
          special_abilities: Json
          type: Database['public']['Enums']['homebrew_type']
        }
        Insert: {
          ac?: number | null
          actions: Json
          campaign: number
          created_at?: string
          health?: number | null
          id?: number
          initiative_modifier?: string | null
          legendary_actions: Json
          link?: string | null
          name: string
          player?: string | null
          reactions: Json
          special_abilities: Json
          type?: Database['public']['Enums']['homebrew_type']
        }
        Update: {
          ac?: number | null
          actions?: Json
          campaign?: number
          created_at?: string
          health?: number | null
          id?: number
          initiative_modifier?: string | null
          legendary_actions?: Json
          link?: string | null
          name?: string
          player?: string | null
          reactions?: Json
          special_abilities?: Json
          type?: Database['public']['Enums']['homebrew_type']
        }
        Relationships: [
          {
            foreignKeyName: 'homebrew_items_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      initiative_sheets: {
        Row: {
          activeIndex: number
          campaign: number | null
          created_at: string | null
          created_by: string
          id: number
          info: string | null
          info_cards: Json
          round: number
          rows: Json
          settings: Json | null
          title: string
        }
        Insert: {
          activeIndex?: number
          campaign?: number | null
          created_at?: string | null
          created_by?: string
          id?: number
          info?: string | null
          info_cards?: Json
          round?: number
          rows: Json
          settings?: Json | null
          title: string
        }
        Update: {
          activeIndex?: number
          campaign?: number | null
          created_at?: string | null
          created_by?: string
          id?: number
          info?: string | null
          info_cards?: Json
          round?: number
          rows?: Json
          settings?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'initiative_sheets_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'initiative_sheets_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      join_campaign: {
        Row: {
          campaign: number
          created_at: string
          id: number
          role: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Insert: {
          campaign: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          token: string
          user: string
        }
        Update: {
          campaign?: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          token?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: 'join_campaign_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'join_campaign_user_fkey'
            columns: ['user']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      magic_items: {
        Row: {
          campaign: number | null
          created_at: string
          created_by: string | null
          description: string
          id: number
          name: string
          rarity: Database['public']['Enums']['rarity']
          requires_attunement: string | null
          rules: Database['public']['Enums']['rules']
          type: Database['public']['Enums']['magic_item_type']
        }
        Insert: {
          campaign?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: number
          name: string
          rarity: Database['public']['Enums']['rarity']
          requires_attunement?: string | null
          rules?: Database['public']['Enums']['rules']
          type: Database['public']['Enums']['magic_item_type']
        }
        Update: {
          campaign?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: number
          name?: string
          rarity?: Database['public']['Enums']['rarity']
          requires_attunement?: string | null
          rules?: Database['public']['Enums']['rules']
          type?: Database['public']['Enums']['magic_item_type']
        }
        Relationships: [
          {
            foreignKeyName: 'magic_items_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'magic_items_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      monsters: {
        Row: {
          actions: Json[]
          alignment: Database['public']['Enums']['alignment']
          armor_class: number | null
          armor_description: string | null
          bonus_actions: Json[]
          campaign: number | null
          charisma: number | null
          charisma_save: number | null
          condition_immunities: string | null
          constitution: number | null
          constitution_save: number | null
          cr: number | null
          created_at: string
          created_by: string | null
          damage_immunities: string | null
          damage_resistances: string | null
          damage_vulnerabilities: string | null
          description: string
          dexterity: number | null
          dexterity_save: number | null
          environments: string[]
          hit_dice: string | null
          hit_points: number | null
          id: number
          intelligence: number | null
          intelligence_save: number | null
          languages: string | null
          legendary_actions: Json[]
          legendary_description: string | null
          name: string
          perception: number | null
          reactions: Json[]
          rules: Database['public']['Enums']['rules']
          senses: string | null
          size: Database['public']['Enums']['monster_size']
          skills: Json
          special_abilities: Json[]
          speed: Json
          strength: number | null
          strength_save: number | null
          subtype: string
          type: Database['public']['Enums']['monster_type']
          wisdom: number | null
          wisdom_save: number | null
        }
        Insert: {
          actions?: Json[]
          alignment: Database['public']['Enums']['alignment']
          armor_class?: number | null
          armor_description?: string | null
          bonus_actions?: Json[]
          campaign?: number | null
          charisma?: number | null
          charisma_save?: number | null
          condition_immunities?: string | null
          constitution?: number | null
          constitution_save?: number | null
          cr?: number | null
          created_at?: string
          created_by?: string | null
          damage_immunities?: string | null
          damage_resistances?: string | null
          damage_vulnerabilities?: string | null
          description: string
          dexterity?: number | null
          dexterity_save?: number | null
          environments?: string[]
          hit_dice?: string | null
          hit_points?: number | null
          id?: number
          intelligence?: number | null
          intelligence_save?: number | null
          languages?: string | null
          legendary_actions?: Json[]
          legendary_description?: string | null
          name: string
          perception?: number | null
          reactions?: Json[]
          rules?: Database['public']['Enums']['rules']
          senses?: string | null
          size: Database['public']['Enums']['monster_size']
          skills?: Json
          special_abilities?: Json[]
          speed?: Json
          strength?: number | null
          strength_save?: number | null
          subtype: string
          type: Database['public']['Enums']['monster_type']
          wisdom?: number | null
          wisdom_save?: number | null
        }
        Update: {
          actions?: Json[]
          alignment?: Database['public']['Enums']['alignment']
          armor_class?: number | null
          armor_description?: string | null
          bonus_actions?: Json[]
          campaign?: number | null
          charisma?: number | null
          charisma_save?: number | null
          condition_immunities?: string | null
          constitution?: number | null
          constitution_save?: number | null
          cr?: number | null
          created_at?: string
          created_by?: string | null
          damage_immunities?: string | null
          damage_resistances?: string | null
          damage_vulnerabilities?: string | null
          description?: string
          dexterity?: number | null
          dexterity_save?: number | null
          environments?: string[]
          hit_dice?: string | null
          hit_points?: number | null
          id?: number
          intelligence?: number | null
          intelligence_save?: number | null
          languages?: string | null
          legendary_actions?: Json[]
          legendary_description?: string | null
          name?: string
          perception?: number | null
          reactions?: Json[]
          rules?: Database['public']['Enums']['rules']
          senses?: string | null
          size?: Database['public']['Enums']['monster_size']
          skills?: Json
          special_abilities?: Json[]
          speed?: Json
          strength?: number | null
          strength_save?: number | null
          subtype?: string
          type?: Database['public']['Enums']['monster_type']
          wisdom?: number | null
          wisdom_save?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'monsters_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'monsters_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      notes: {
        Row: {
          campaign: number
          created_at: string | null
          id: number
          text: string | null
          title: string
        }
        Insert: {
          campaign: number
          created_at?: string | null
          id?: number
          text?: string | null
          title: string
        }
        Update: {
          campaign?: number
          created_at?: string | null
          id?: number
          text?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notes_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          avatar_options: Json | null
          badges: Json
          completedTour: boolean
          created_at: string
          email: string
          id: string
          marketing: boolean
          name: string
          stripe_id: string | null
          stripe_session_id: string | null
          subscription_type: Database['public']['Enums']['subscription_type']
          temp_subscription: Database['public']['Enums']['subscription_type']
          username: string
        }
        Insert: {
          avatar: string
          avatar_options?: Json | null
          badges?: Json
          completedTour?: boolean
          created_at?: string
          email: string
          id: string
          marketing?: boolean
          name: string
          stripe_id?: string | null
          stripe_session_id?: string | null
          subscription_type?: Database['public']['Enums']['subscription_type']
          temp_subscription?: Database['public']['Enums']['subscription_type']
          username: string
        }
        Update: {
          avatar?: string
          avatar_options?: Json | null
          badges?: Json
          completedTour?: boolean
          created_at?: string
          email?: string
          id?: string
          marketing?: boolean
          name?: string
          stripe_id?: string | null
          stripe_session_id?: string | null
          subscription_type?: Database['public']['Enums']['subscription_type']
          temp_subscription?: Database['public']['Enums']['subscription_type']
          username?: string
        }
        Relationships: []
      }
      spells: {
        Row: {
          archetype: string | null
          campaign: number | null
          can_be_cast_as_ritual: boolean
          casting_time: string
          circles: string | null
          concentration: boolean
          created_at: string
          created_by: string | null
          description: string
          dnd_class: string
          duration: string
          higher_level: string | null
          id: number
          material: string | null
          material_components: boolean
          name: string
          range: string
          range_value: number
          ritual: boolean
          rules: Database['public']['Enums']['rules']
          school: Database['public']['Enums']['magic_school']
          somatic_components: boolean
          spell_level: number
          verbal_components: boolean
        }
        Insert: {
          archetype?: string | null
          campaign?: number | null
          can_be_cast_as_ritual: boolean
          casting_time: string
          circles?: string | null
          concentration: boolean
          created_at?: string
          created_by?: string | null
          description: string
          dnd_class: string
          duration: string
          higher_level?: string | null
          id?: number
          material?: string | null
          material_components: boolean
          name: string
          range: string
          range_value: number
          ritual: boolean
          rules?: Database['public']['Enums']['rules']
          school: Database['public']['Enums']['magic_school']
          somatic_components: boolean
          spell_level: number
          verbal_components: boolean
        }
        Update: {
          archetype?: string | null
          campaign?: number | null
          can_be_cast_as_ritual?: boolean
          casting_time?: string
          circles?: string | null
          concentration?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          dnd_class?: string
          duration?: string
          higher_level?: string | null
          id?: number
          material?: string | null
          material_components?: boolean
          name?: string
          range?: string
          range_value?: number
          ritual?: boolean
          rules?: Database['public']['Enums']['rules']
          school?: Database['public']['Enums']['magic_school']
          somatic_components?: boolean
          spell_level?: number
          verbal_components?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'spells_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'spells_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      team: {
        Row: {
          campaign: number
          created_at: string
          id: number
          role: Database['public']['Enums']['user_role']
          user: string
        }
        Insert: {
          campaign: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          user: string
        }
        Update: {
          campaign?: number
          created_at?: string
          id?: number
          role?: Database['public']['Enums']['user_role']
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: 'team_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'team_user_fkey'
            columns: ['user']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      weapons: {
        Row: {
          campaign: number | null
          category: Database['public']['Enums']['weapon_category']
          cost: string | null
          created_at: string
          created_by: string | null
          damage_dice: string
          damage_type: Database['public']['Enums']['damage_type']
          id: number
          name: string
          properties: string[]
          rules: Database['public']['Enums']['rules']
          weight: string | null
        }
        Insert: {
          campaign?: number | null
          category: Database['public']['Enums']['weapon_category']
          cost?: string | null
          created_at?: string
          created_by?: string | null
          damage_dice: string
          damage_type: Database['public']['Enums']['damage_type']
          id?: number
          name: string
          properties?: string[]
          rules?: Database['public']['Enums']['rules']
          weight?: string | null
        }
        Update: {
          campaign?: number | null
          category?: Database['public']['Enums']['weapon_category']
          cost?: string | null
          created_at?: string
          created_by?: string | null
          damage_dice?: string
          damage_type?: Database['public']['Enums']['damage_type']
          id?: number
          name?: string
          properties?: string[]
          rules?: Database['public']['Enums']['rules']
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'weapons_campaign_fkey'
            columns: ['campaign']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'weapons_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never, Returns: number }
      show_trgm: { Args: { '': string }, Returns: string[] }
    }
    Enums: {
      action_type:
        | 'actions'
        | 'legendary_actions'
        | 'reactions'
        | 'special_abilities'
      alignment:
        | 'Lawful good'
        | 'Lawful neutral'
        | 'Lawful evil'
        | 'Neutral good'
        | 'Neutral'
        | 'Neutral evil'
        | 'Chaotic good'
        | 'Chaotic neutral'
        | 'Chaotic evil'
        | 'Any alignment'
        | 'Any non-good alignment'
        | 'Any non-lawful alignment'
        | 'Any chaotic alignment'
        | 'Any evil alignment'
        | 'Unaligned'
      armor_category:
        | 'Heavy Armor'
        | 'Medium Armor'
        | 'Light Armor'
        | 'No Armor'
        | 'Class Feature'
        | 'Spell'
        | 'Shield'
      damage_type:
        | 'Acid'
        | 'Bludgeoning'
        | 'cold'
        | 'Fire'
        | 'Force'
        | 'Lightning'
        | 'Necrotic'
        | 'Piercing'
        | 'Poison'
        | 'Psychic'
        | 'Radiant'
        | 'Slashing'
        | 'Thunder'
        | 'Other'
      feature_request_status: 'review' | 'accepted' | 'progress' | 'added'
      homebrew_type: 'player' | 'summon' | 'npc' | 'monster' | 'lair'
      initiative_pet:
        | 'cat'
        | 'chicken'
        | 'barmaid'
        | 'crawler'
        | 'dragon'
        | 'fairy'
        | 'redcap'
        | 'wolf-rider'
      magic_item_type:
        | 'Wondrous item'
        | 'Armor'
        | 'Weapon'
        | 'Staff'
        | 'Wand'
        | 'Rod'
        | 'Ring'
        | 'Scroll'
        | 'Potion'
      magic_school:
        | 'Evocation'
        | 'Conjuration'
        | 'Abjuration'
        | 'Transmutation'
        | 'Enchantment'
        | 'Necromancy'
        | 'Divination'
        | 'Illusion'
      monster_size:
        | 'Tiny'
        | 'Small'
        | 'Medium'
        | 'Large'
        | 'Huge'
        | 'Gargantuan'
      monster_type:
        | 'Aberration'
        | 'Humanoid'
        | 'Dragon'
        | 'Elemental'
        | 'Monstrosity'
        | 'Construct'
        | 'Beast'
        | 'Plant'
        | 'Fiend'
        | 'Ooze'
        | 'Fey'
        | 'Giant'
        | 'Celestial'
        | 'Undead'
      rarity:
        | 'Common'
        | 'Uncommon'
        | 'Rare'
        | 'Very rare'
        | 'Legendary'
        | 'Artifact'
        | 'Varies'
      rules: '5e'
      subscription_type: 'free' | 'medior' | 'pro'
      table_spacing: 'compact' | 'normal' | 'cozy'
      user_role: 'Viewer' | 'Admin' | 'Owner' | 'Player'
      weapon_category:
        | 'Martial Melee Weapons'
        | 'Martial Ranged Weapons'
        | 'Simple Melee Weapons'
        | 'Simple Ranged Weapons'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: [
        'actions',
        'legendary_actions',
        'reactions',
        'special_abilities',
      ],
      alignment: [
        'Lawful good',
        'Lawful neutral',
        'Lawful evil',
        'Neutral good',
        'Neutral',
        'Neutral evil',
        'Chaotic good',
        'Chaotic neutral',
        'Chaotic evil',
        'Any alignment',
        'Any non-good alignment',
        'Any non-lawful alignment',
        'Any chaotic alignment',
        'Any evil alignment',
        'Unaligned',
      ],
      armor_category: [
        'Heavy Armor',
        'Medium Armor',
        'Light Armor',
        'No Armor',
        'Class Feature',
        'Spell',
        'Shield',
      ],
      damage_type: [
        'Acid',
        'Bludgeoning',
        'cold',
        'Fire',
        'Force',
        'Lightning',
        'Necrotic',
        'Piercing',
        'Poison',
        'Psychic',
        'Radiant',
        'Slashing',
        'Thunder',
        'Other',
      ],
      feature_request_status: ['review', 'accepted', 'progress', 'added'],
      homebrew_type: ['player', 'summon', 'npc', 'monster', 'lair'],
      initiative_pet: [
        'cat',
        'chicken',
        'barmaid',
        'crawler',
        'dragon',
        'fairy',
        'redcap',
        'wolf-rider',
      ],
      magic_item_type: [
        'Wondrous item',
        'Armor',
        'Weapon',
        'Staff',
        'Wand',
        'Rod',
        'Ring',
        'Scroll',
        'Potion',
      ],
      magic_school: [
        'Evocation',
        'Conjuration',
        'Abjuration',
        'Transmutation',
        'Enchantment',
        'Necromancy',
        'Divination',
        'Illusion',
      ],
      monster_size: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'],
      monster_type: [
        'Aberration',
        'Humanoid',
        'Dragon',
        'Elemental',
        'Monstrosity',
        'Construct',
        'Beast',
        'Plant',
        'Fiend',
        'Ooze',
        'Fey',
        'Giant',
        'Celestial',
        'Undead',
      ],
      rarity: [
        'Common',
        'Uncommon',
        'Rare',
        'Very rare',
        'Legendary',
        'Artifact',
        'Varies',
      ],
      rules: ['5e'],
      subscription_type: ['free', 'medior', 'pro'],
      table_spacing: ['compact', 'normal', 'cozy'],
      user_role: ['Viewer', 'Admin', 'Owner', 'Player'],
      weapon_category: [
        'Martial Melee Weapons',
        'Martial Ranged Weapons',
        'Simple Melee Weapons',
        'Simple Ranged Weapons',
      ],
    },
  },
} as const
