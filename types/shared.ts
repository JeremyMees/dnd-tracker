export type Dice = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'

export type Color = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'help' | 'danger' | 'black'

export type Position = 'top' | 'right' | 'bottom' | 'left'

export interface Option<T> {
  label: string
  value: T | number | string
}

export interface Route {
  label: string
  url: string
  requireAuth: boolean
}

export type ActionType = 'actions' | 'legendary_actions' | 'reactions' | 'special_abilities'

export interface Abilities {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface Action {
  name: string
  desc: string
  type?: ActionType
  attack_bonus?: number
  damage_bonus?: number
  damage_dice?: string
}

export interface PossibleAttacks {
  actions: Action[]
  legendary_actions: Action[]
  reactions: Action[]
  special_abilities: Action[]
}
