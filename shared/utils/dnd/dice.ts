import { dices } from '~~/constants/dnd'

export function randomRoll(max: number): number {
  return Math.floor(Math.random() * max) + 1
}

export function rollDice(dice: number, amount = 1): number[] {
  const rolls: number[] = []

  for (let i = 0; i < amount; i++) {
    rolls.push(randomRoll(+dice))
  }

  return rolls
}

const MAX_DICE_COUNT = 100

export function validateDiceExpression(diceExpr: string): boolean {
  const match = diceExpr.match(diceExpression)

  if (!match) return false

  const diceCount = parseInt(match[1]!)
  const diceSides = parseInt(match[2]!)

  if (diceCount <= 0 || diceCount > MAX_DICE_COUNT) return false
  if (!dices.includes(diceSides as DndDiceSide)) return false

  return true
}

export function parseDamageDice(damageDice?: string): { count: number, sides: number }[] {
  if (!damageDice) return []

  return damageDice
    .split(/[+\s]+/)
    .map(dice => dice.trim())
    .filter(dice => dice.length > 0)
    .filter(validateDiceExpression)
    .map((dice) => {
      const [count, sides] = dice.split('d')
      return { count: parseInt(count!), sides: parseInt(sides!) }
    })
}

export function formatAttackDice(count?: number, type?: DndDice): string | undefined {
  if (!count || !type) return undefined
  return `${count}${type}`
}

export function parseAttackDice(expr?: string | null): { damageDieCount: number, damageDieType: DndDice } | undefined {
  if (!expr) return undefined

  const match = expr.match(/^(\d+)(d4|d6|d8|d10|d12|d20|d100)$/i)
  if (!match) return undefined

  return {
    damageDieCount: Number.parseInt(match[1]!, 10),
    damageDieType: match[2]!.toLowerCase() as DndDice,
  }
}

export function parseHitDice(hitDice: string): DndHitDice {
  const match = hitDice.match(/(\d+)d(4|6|8|10|12|20|100)([+-]\d+)?/i)

  if (!match) {
    return {
      hitDiceCount: 1,
      hitDiceType: 'd4',
    }
  }

  const [, count, side, bonus] = match

  return {
    hitDiceCount: Number.parseInt(count!, 10),
    hitDiceType: `d${side}` as DndDice,
    ...(bonus ? { hitDiceBonus: Number.parseInt(bonus, 10) } : {}),
  }
}

export function parseDndDiceToString(hitDice: DndHitDice): string {
  const { hitDiceCount, hitDiceType, hitDiceBonus } = hitDice
  const bonusStr = hitDiceBonus ? (hitDiceBonus > 0 ? `+${hitDiceBonus}` : `${hitDiceBonus}`) : ''

  return `${hitDiceCount}${hitDiceType}${bonusStr}`
}
