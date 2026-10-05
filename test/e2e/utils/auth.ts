import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium, selectors } from 'playwright-core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { dismissConsent } from './consent'
import { host } from './env'
import { supabaseClient } from './supabase'

export const storageState = 'test/e2e/.auth/user.json'

export interface SignedInClient {
  supabase: SupabaseClient<DB>
  userId: string
}

export async function signInClient(
  email: string,
  password: string,
): Promise<SignedInClient> {
  const supabase = supabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error

  return { supabase, userId: data.user.id }
}

export async function saveSession(
  email: string,
  password: string,
): Promise<void> {
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
