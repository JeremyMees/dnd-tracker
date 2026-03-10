export type Dice = 'd100' | 'd20' | 'd12' | 'd10' | 'd8' | 'd6' | 'd4'
export type DiceSide = 4 | 6 | 8 | 10 | 12 | 20 | 100

export type HealthType = 'heal' | 'damage' | 'temp' | 'override' | 'override-reset'
export type AcType = 'add' | 'remove' | 'temp' | 'override' | 'override-reset'

export type DndRace = 'human' | 'elf' | 'dwarf' | 'halfling' | 'dragonborn' | 'gnome' | 'half-elf' | 'half-orc' | 'tiefling'
export type Gender = 'male' | 'female' | 'nonbinary'

export type Skill
  = | 'acrobatics'
    | 'animal_handling'
    | 'arcana'
    | 'athletics'
    | 'deception'
    | 'history'
    | 'insight'
    | 'intimidation'
    | 'investigation'
    | 'medicine'
    | 'nature'
    | 'perception'
    | 'performance'
    | 'persuasion'
    | 'religion'
    | 'sleight_of_hand'
    | 'stealth'
    | 'survival'

export interface SkillBonuses {
  acrobatics: number
  animal_handling: number
  arcana: number
  athletics: number
  deception: number
  history: number
  insight: number
  intimidation: number
  investigation: number
  medicine: number
  nature: number
  perception: number
  performance: number
  persuasion: number
  religion: number
  sleight_of_hand: number
  stealth: number
  survival: number
}

export type Abilities
  = | 'strength'
    | 'dexterity'
    | 'constitution'
    | 'intelligence'
    | 'wisdom'
    | 'charisma'

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type Modifiers = AbilityScores
export type SavingThrowBonuses = AbilityScores

export interface Movement {
  unit: 'feet'
  walk: number
  crawl: number
  hover: boolean
  fly: number
  burrow: number
  climb: number
  swim: number
}
