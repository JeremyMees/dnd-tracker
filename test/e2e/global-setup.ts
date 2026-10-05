import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium, selectors } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import { dismissConsent, host, requireEnv, storageState } from './helpers'

async function assertServerHealthy(): Promise<void> {
  const response = await fetch(host).catch(() => null)

  if (!response?.ok) {
    throw new Error(
      `No healthy Nuxt server at ${host} (status: ${response?.status ?? 'unreachable'}). Start it with npm run dev:e2e.`,
    )
  }
}

async function saveSession(email: string, password: string): Promise<void> {
  selectors.setTestIdAttribute('test-id')
  const browser = await chromium.launch()

  try {
    const page = await browser.newPage()
    await page.goto(`${host}/login`)
    await page.waitForFunction('window.useNuxtApp?.().isHydrating === false')
    await dismissConsent(page)

    await page.getByTestId('email').fill(email)
    await page.getByTestId('password').fill(password)
    await page.getByTestId('submit').click()

    const loginError = page.getByTestId('error')
    const outcome = await Promise.race([
      page
        .waitForURL(url => !url.pathname.endsWith('/login'))
        .then(
          () => 'signed-in',
          () => 'timeout',
        ),
      loginError.waitFor().then(
        () => 'rejected',
        () => 'timeout',
      ),
    ])

    if (outcome === 'rejected') {
      throw new Error(
        `Login as ${email} failed: "${await loginError.innerText()}". Is the server on ${host} running with npm run dev:e2e?`,
      )
    }

    if (outcome === 'timeout') {
      throw new Error(`Login as ${email} did not leave /login on ${host}`)
    }

    await mkdir(dirname(storageState), { recursive: true })
    await page.context().storageState({ path: storageState })
  } finally {
    await browser.close()
  }
}

async function emptyLocalDatabase(): Promise<void> {
  const url = requireEnv('SUPABASE_URL')
  const { hostname } = new URL(url)

  if (!['127.0.0.1', 'localhost'].includes(hostname)) {
    throw new Error(`Refusing to empty a non-local database: ${url}`)
  }

  const supabase = createClient(url, requireEnv('SUPABASE_SECRET_KEY'), {
    auth: { persistSession: false },
  })

  async function empty(table: DatabaseTable) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) throw error
  }

  await empty('initiative_sheets')
  await empty('campaigns')
  await empty('features')
}

export default async function setup(): Promise<() => Promise<void>> {
  const email = requireEnv('E2E_EMAIL')
  const password = requireEnv('E2E_PASSWORD')

  await assertServerHealthy()
  await emptyLocalDatabase()
  await saveSession(email, password)

  return emptyLocalDatabase
}
