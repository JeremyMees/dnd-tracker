export function formatBonus(val: number): string {
  return val >= 0 ? `+${val}` : `${val}`
}
