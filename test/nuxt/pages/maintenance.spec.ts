import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Maintenance from '~/pages/maintenance.vue'

function mountPage() {
  return mountSuspended(Maintenance)
}

describe('Maintenance page', () => {
  it('Should render the title and text', async () => {
    const component = await mountPage()

    expect(component.get('[data-test-title]').text()).toBe(
      'pages.maintenance.title',
    )
    expect(component.get('[data-test-text]').text()).toBe(
      'pages.maintenance.text',
    )
  })
})
