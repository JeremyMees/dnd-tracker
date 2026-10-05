import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium, selectors } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import {
  dismissConsent,
  host,
  prefix,
  requireEnv,
  storageState,
} from './helpers'

async function assertServerHealthy(): Promise<void> {
  const response = await fetch(host).catch(() => null)

  if (!response?.ok) {
    throw new Error(
      `No healthy Nuxt server at ${host} (status: ${response?.status ?? 'unreachable'}). Start it with npm run dev.`,
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
    await page.waitForURL(url => !url.pathname.endsWith('/login'))

    await mkdir(dirname(storageState), { recursive: true })
    await page.context().storageState({ path: storageState })
  } finally {
    await browser.close()
  }
}

async function removeTestData(email: string, password: string): Promise<void> {
  const supabase = createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_KEY'),
    { auth: { persistSession: false } },
  )

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (authError) throw authError

  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .like('title', `${prefix}%`)
    if (error) throw error
  } finally {
    await supabase.auth.signOut()
  }
}

export default async function setup(): Promise<() => Promise<void>> {
  const email = requireEnv('E2E_EMAIL')
  const password = requireEnv('E2E_PASSWORD')

  await assertServerHealthy()
  await removeTestData(email, password)
  await saveSession(email, password)

  return () => removeTestData(email, password)
}
