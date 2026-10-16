import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import type { VNode } from 'vue'
import { generateColumns } from '~/tables/encounter-listing'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockEncounterItem } from '~~/test/fixtures/encounter'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

mockNuxtImport('useAuthenticatedUser', () => () => ref(authUser))

const lockedEncounter: EncounterItem = {
  ...mockEncounterItem,
  createdBy: { id: authUser.id, username: 'aldric', avatar: 'avatar-url' },
  campaign: {
    ...mockEncounterItem.campaign,
    createdBy: {
      ...mockEncounterItem.campaign.createdBy,
      subscriptionType: 'free',
    },
  },
}

function cell(header: string | undefined, encounter: EncounterItem): VNode {
  const columns = generateColumns({
    isCampaign: false,
    onShare: () => {},
    onCopy: () => {},
    onUpdate: () => {},
  })
  const column = columns.find(item =>
    header ? item.header === header : item.id === 'actions',
  )

  return (column?.cell as (context: unknown) => VNode)({
    row: {
      original: encounter,
      getValue: (key: keyof EncounterItem) => encounter[key],
      getIsSelected: () => false,
      getCanSelect: () => true,
      getToggleSelectedHandler: () => () => {},
    },
  })
}

let wrapper: VueWrapper | undefined

async function mountCell(content: VNode | string) {
  wrapper = await mountWithTooltips(
    defineComponent({ render: () => h('div', [content]) }),
  )

  return wrapper
}

describe('Encounter listing columns', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should lock an encounter of a campaign whose owner is not on pro', async () => {
    const component = await mountCell(cell('general.name', lockedEncounter))

    expect(component.find('[test-id="locked"]').text()).toContain(
      'pages.campaigns.suspended.badge',
    )
    expect(component.find('a').exists()).toBe(false)
  })

  it('Should show the campaign of a locked encounter without a link', async () => {
    const component = await mountCell(cell('general.campaign', lockedEncounter))

    expect(component.text()).toBe(lockedEncounter.campaign.title)
    expect(component.find('a').exists()).toBe(false)
  })

  it('Should disable the share action of a locked encounter', async () => {
    const component = await mountCell(cell(undefined, lockedEncounter))

    expect(
      component.findAll('button').every(button => button.element.disabled),
    ).toBe(true)
  })

  it('Should link the encounter while the campaign owner is on pro', async () => {
    const component = await mountCell(cell('general.name', mockEncounterItem))

    expect(component.find('[test-id="locked"]').exists()).toBe(false)
    expect(component.find('a').exists()).toBe(true)
  })
})
