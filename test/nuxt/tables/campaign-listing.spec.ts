import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it } from 'vitest'
import { generateColumns } from '~/tables/campaign-listing'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockCampaignItem } from '~~/test/fixtures/campaign'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'
import type { VueWrapper } from '@vue/test-utils'
import type { VNode } from 'vue'

mockNuxtImport('useAuthenticatedUser', () => () => ref(authUser))

function roleCell(campaign: CampaignItem): unknown {
  const columns = generateColumns({
    onUpdate: () => {},
    onLeave: async () => {},
  })
  const column = columns.find(({ header }) => header === 'general.role')

  return (column?.cell as (context: unknown) => unknown)({
    row: { original: campaign },
  })
}

const profile = {
  id: authUser.id,
  username: 'aldric',
  avatar: 'avatar-url',
  subscriptionType: 'free' as const,
}

function titleCell(campaign: CampaignItem): VNode {
  const columns = generateColumns({
    onUpdate: () => {},
    onLeave: async () => {},
  })
  const column = columns.find(({ header }) => header === 'general.name')

  return (column?.cell as (context: unknown) => VNode)({
    row: { original: campaign, getValue: () => campaign.title },
  })
}

let wrapper: VueWrapper | undefined

async function mountCell(cell: VNode) {
  wrapper = await mountWithTooltips(defineComponent({ render: () => cell }))

  return wrapper
}

describe('Campaign listing columns', () => {
  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
  })

  it('Should show the owner role', () => {
    expect(roleCell({ ...mockCampaignItem, createdBy: profile })).toBe(
      'general.owner',
    )
  })

  it('Should show the admin role', () => {
    expect(
      roleCell({
        ...mockCampaignItem,
        team: [{ id: 5, role: 'Admin', user: profile }],
      }),
    ).toBe('general.admin')
  })

  it('Should show a pending invite', () => {
    expect(
      roleCell({
        ...mockCampaignItem,
        join_campaign: [{ user: 'someone-else' }, { user: authUser.id }],
      }),
    ).toBe('general.invited')
  })

  it('Should show nothing without a role or invite', () => {
    expect(
      roleCell({
        ...mockCampaignItem,
        join_campaign: [{ user: 'someone-else' }],
      }),
    ).toBe('')
  })

  describe('Locked campaigns', () => {
    it('Should lock the campaign for a member while the owner is not on pro', async () => {
      const component = await mountCell(
        titleCell({
          ...mockCampaignItem,
          createdBy: {
            ...mockCampaignItem.createdBy,
            subscriptionType: 'free',
          },
        }),
      )

      expect(component.find('[test-id="locked"]').text()).toContain(
        'pages.campaigns.suspended.badge',
      )
      expect(component.find('a').exists()).toBe(false)
    })

    it('Should link the campaign while the owner is on pro', async () => {
      const component = await mountCell(titleCell(mockCampaignItem))

      expect(component.find('[test-id="locked"]').exists()).toBe(false)
      expect(component.find('a').exists()).toBe(true)
    })

    it('Should keep the link for the owner even without pro', async () => {
      const component = await mountCell(
        titleCell({ ...mockCampaignItem, createdBy: profile }),
      )

      expect(component.find('[test-id="locked"]').exists()).toBe(false)
      expect(component.find('a').exists()).toBe(true)
    })
  })
})
