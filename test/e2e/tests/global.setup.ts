import path from 'path'
import { fileURLToPath } from 'url'
import { test as setup, expect } from '../base'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const authFile = path.join(__dirname, '../.auth/user.json')

setup('Global setup', async ({ loginPage, testHelpers, page }) => {
  await loginPage.goto()
  await testHelpers.acceptCookies()

  const loggedIn = await testHelpers.loggedIn()

  if (!loggedIn) {
    await loginPage.login('jeremymees123+e2e@gmail.com', 'Tester-123')

    await expect(loginPage.errorMessages).not.toBeVisible()
    await expect(loginPage.page).toHaveURL(/\/en/)

    await page.waitForResponse(response => response.url().includes('auth/v1/token'))
  }

  await page.context().storageState({ path: authFile })
})
