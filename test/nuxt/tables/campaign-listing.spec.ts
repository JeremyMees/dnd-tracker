import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { generateColumns } from '~/tables/campaign-listing'
import { authUser } from '~~/test/fixtures/auth-user'
import { mockCampaignItem } from '~~/test/fixtures/campaign'

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

const profile = { id: authUser.id, username: 'aldric', avatar: 'avatar-url' }

describe('Campaign listing columns', () => {
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
})
