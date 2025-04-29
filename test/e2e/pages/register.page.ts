import type { Locator, Page } from '@playwright/test'

export class RegisterPage {
  public url = '/en/register'
  readonly page: Page
  readonly errorMessages: Locator

  constructor (page: Page) {
    this.page = page

    this.errorMessages = page.locator('[data-message-type="error"]')
  }

  async goto() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' })
  }

  async register(name: string, username: string, email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'Volledige naam*' }).click()
    await this.page.getByRole('textbox', { name: 'Volledige naam*' }).fill(name)
    await this.page.getByRole('textbox', { name: 'Gebruikersnaam*' }).click()
    await this.page.getByRole('textbox', { name: 'Gebruikersnaam*' }).fill(username)
    await this.page.getByRole('textbox', { name: 'E-mail adres*' }).click()
    await this.page.getByRole('textbox', { name: 'E-mail adres*' }).fill(email)
    await this.page.getByRole('textbox', { name: 'Wachtwoord*' }).click()
    await this.page.getByRole('textbox', { name: 'Wachtwoord*' }).fill(password)
    await this.page.getByRole('button', { name: 'Registreer' }).click()
  }
}
