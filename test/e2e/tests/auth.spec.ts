import { test, expect } from '../base'

test.use({ storageState: { cookies: [], origins: [] } })

test('Login succeeds', async ({ loginPage, testHelpers }) => {
  await loginPage.goto()
  await testHelpers.acceptCookies()
  await loginPage.login('jeremymees123+e2e@gmail.com', 'Tester-123')

  await expect(loginPage.errorMessages).not.toBeVisible()
  await expect(loginPage.page).toHaveURL(/\/en/)
})

test('Login fails', async ({ loginPage, testHelpers }) => {
  await loginPage.goto()
  await testHelpers.acceptCookies()
  await loginPage.login('test@test.com', 'testing error')

  await expect(loginPage.errorMessages).toBeVisible()
})

test('Register succeeds', async ({ registerPage, testHelpers }) => {
  // await registerPage.goto()
  // await testHelpers.acceptCookies()
  // await registerPage.register('Playwright Test', 'endToEnd', 'jeremymees123+test-e2e@gmail.com', 'Tester-123')

  // await this.page.getByRole('alert', { name: 'Succesvol registreerd' }).click();

  // await expect(loginPage.errorMessages).not.toBeVisible()
  // await expect(loginPage.page).toHaveURL(/\/en/)
})

test('Register fails', async ({ loginPage, testHelpers }) => {
  // await loginPage.goto()
  // await testHelpers.acceptCookies()
  // await loginPage.login('test@test.com', 'testing error')

  // await expect(loginPage.errorMessages).toBeVisible()
})
