import { saveSession, host, requireEnv, emptyLocalDatabase } from './utils'

async function assertServerHealthy(): Promise<void> {
  const response = await fetch(host).catch(() => null)

  if (!response?.ok) {
    throw new Error(
      `No healthy Nuxt server at ${host} (status: ${response?.status ?? 'unreachable'}). Start it with npm run dev:e2e.`,
    )
  }
}

export default async function setup(): Promise<() => Promise<void>> {
  await assertServerHealthy()
  await emptyLocalDatabase()
  await saveSession(requireEnv('E2E_EMAIL'), requireEnv('E2E_PASSWORD'))

  return emptyLocalDatabase
}
