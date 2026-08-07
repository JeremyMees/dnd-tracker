import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Maintenance from '~/pages/maintenance.vue'

function mountPage() {
  return mountSuspended(Maintenance)
}

describe('Maintenance page', () => {
  it('Should render the title and text', async () => {
    const component = await mountPage()

    expect(component.get('[test-id="title"]').text()).toBe(
      'pages.maintenance.title',
    )
    expect(component.get('[test-id="text"]').text()).toBe(
      'pages.maintenance.text',
    )
  })
})
