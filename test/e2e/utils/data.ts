export const prefix = '[e2e]'

export function testTitle(name: string): string {
  return `${prefix} ${name} ${Date.now()}`
}
