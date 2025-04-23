import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  public url = '/en/login'
  readonly page: Page
  readonly errorMessages: Locator

  constructor (page: Page) {
    this.page = page

    this.errorMessages = page.locator('[data-message-type="error"]')
  }

  async goto() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' })
  }

  async login(email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Email address*' }).click()
    await this.page.getByRole('textbox', { name: 'Email address*' }).fill(email)
    await this.page.getByRole('textbox', { name: 'Password*' }).click()
    await this.page.getByRole('textbox', { name: 'Password*' }).fill(password)
    await this.page.getByRole('button', { name: 'Sign in' }).click()
  }
}
