import type { Row } from '@tanstack/vue-table'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ActionsTable from '~/components/atoms/ActionsTable.vue'
import TooltipAtom from '~/components/atoms/Tooltip.vue'
import { expandedMarkup } from '~/tables/homebrew-listing'
import { mockHomebrewItem } from '~~/test/fixtures/homebrew'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

let wrapper: VueWrapper | undefined

async function mountExpandedMarkup(
  initiativeModifier: string | null,
): Promise<VueWrapper> {
  const row = {
    original: { ...mockHomebrewItem, initiativeModifier },
  } as Row<ListingFeatures, HomebrewItemRow>

  wrapper = await mountWithTooltips(
    defineComponent({ render: () => expandedMarkup(row) }),
  )

  return wrapper
}

async function initiativeModifierLabel(
  initiativeModifier: string | null,
): Promise<string> {
  return (await mountExpandedMarkup(initiativeModifier))
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

  it('Should pass the numeric homebrew id to the actions table as a string', async () => {
    const component = await mountExpandedMarkup(null)

    expect(component.getComponent(ActionsTable).props('id')).toBe(
      String(mockHomebrewItem.id),
    )
  })
})
