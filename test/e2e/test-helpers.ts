import type { Locator, Page } from '@playwright/test'

export class TestHelpers {
  readonly page: Page
  readonly cookieAcceptButton: Locator
  readonly profileDropdown: Locator
  readonly logoutButton: Locator

  constructor (page: Page) {
    this.page = page

    this.cookieAcceptButton = page.getByRole('button', { name: 'OK' })
    this.profileDropdown = page.getByRole('button', { name: 'Avatar image' })
    this.logoutButton = page.getByRole('button', { name: 'Log out' })
  }

  async acceptCookies() {
    if (await this.cookieAcceptButton.isVisible()) {
      await this.cookieAcceptButton.click()
    }
  }

  async logout() {
    await this.profileDropdown.click()
    await this.logoutButton.click()
  }

  async loggedIn() {
    return await this.profileDropdown.isVisible()
  }
}
