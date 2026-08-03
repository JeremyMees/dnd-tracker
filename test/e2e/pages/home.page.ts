import type { Page } from '@playwright/test'

export class HomePage {
  public url = '/'
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  async goto() {
    await this.page.goto(this.url, { waitUntil: 'networkidle' })
  }
}
