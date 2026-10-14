import type { Row } from '@tanstack/vue-table'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import TooltipAtom from '~/components/atoms/Tooltip.vue'
import { expandedMarkup } from '~/tables/homebrew-listing'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

let wrapper: VueWrapper | undefined

async function initiativeModifierLabel(
  initiativeModifier: string | null,
): Promise<string> {
  const row = {
    original: { ...mockHomebrewItem, initiativeModifier },
  } as Row<ListingFeatures, HomebrewItemRow>

  wrapper = await mountWithTooltips(
    defineComponent({ render: () => expandedMarkup(row) }),
  )

  return wrapper
    .findAllComponents(TooltipAtom)
    .find(tooltip => tooltip.props('text') === 'general.initiativeModifier')!
    .text()
}

describe('Homebrew listing expanded markup', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should show a positive initiative modifier with a plus', async () => {
    expect(await initiativeModifierLabel('2')).toBe('+2')
  })

  it('Should show a negative initiative modifier without an extra plus', async () => {
    expect(await initiativeModifierLabel('-2')).toBe('-2')
  })

  it('Should show a zero initiative modifier', async () => {
    expect(await initiativeModifierLabel('0')).toBe('+0')
  })

  it('Should show a dash without an initiative modifier', async () => {
    expect(await initiativeModifierLabel(null)).toBe('-')
  })
})
