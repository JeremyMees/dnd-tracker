export const host = process.env.E2E_HOST ?? 'http://localhost:3000'

export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) throw new Error(`Missing ${name} for the e2e run`)

  return value
}
