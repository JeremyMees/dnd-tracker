import { test as base } from '@playwright/test'
import { TestHelpers } from './test-helpers'
import { HomePage, LoginPage, RegisterPage } from './pages'

type TestFixtures = {
  testHelpers: TestHelpers
  homePage: HomePage
  loginPage: LoginPage
  registerPage: RegisterPage
}

export const test = base.extend<TestFixtures>({
  testHelpers: async ({ page }, use) => {
    await use(new TestHelpers(page))
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page))
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page))
  },
})

export { expect } from '@playwright/test'
