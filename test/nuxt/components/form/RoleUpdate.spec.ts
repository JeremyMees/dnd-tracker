import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RoleUpdate from '~/components/form/RoleUpdate.vue'
import { mockCampaignFull, mockTeamMember } from '~~/test/fixtures/campaign'
import { submitForm } from '~~/test/nuxt/stubs/form'
import { mountWithTooltips } from '~~/test/nuxt/stubs/tooltip'

const { updateTeamMember } = vi.hoisted(() => ({ updateTeamMember: vi.fn() }))

vi.mock('~/queries/team-members', () => ({
  useTeamMemberUpdate: () => ({ mutateAsync: updateTeamMember }),
}))

const member: TeamMemberFull = { ...mockTeamMember, role: 'Viewer' }

let wrapper: Awaited<ReturnType<typeof mountWithTooltips>> | undefined

async function mountRoleUpdate(
  overrides: Partial<TeamMemberFull> = {},
  ownerIsPro = true,
) {
  wrapper = await mountWithTooltips(RoleUpdate, {
    props: {
      member: { ...member, ...overrides },
      campaignId: mockCampaignFull.id,
      ownerIsPro,
    },
  })

  return wrapper
}

function adminOption(component: Awaited<ReturnType<typeof mountRoleUpdate>>) {
  return component.get('option[value="Admin"]')
}

async function selectRole(
  component: Awaited<ReturnType<typeof mountRoleUpdate>>,
  role: string,
) {
  component
    .findComponent({ name: 'SelectRoot' })
    .vm.$emit('update:modelValue', role)

  await flushPromises()
}

function updateOptions() {
  return updateTeamMember.mock.calls[0]![0]
}

describe('RoleUpdate', () => {
  beforeEach(() => {
    updateTeamMember.mockResolvedValue(undefined)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    updateTeamMember.mockReset()
  })

  it('Should match snapshot', async () => {
    const component = await mountRoleUpdate()

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render the role select', async () => {
    const component = await mountRoleUpdate()

    expect(component.find('[role="combobox"]').exists()).toBeTruthy()
  })

  it('Should not offer to save while the role is unchanged', async () => {
    const component = await mountRoleUpdate()

    expect(component.find('button[type="submit"]').exists()).toBeFalsy()
  })

  it('Should offer to save once another role is picked', async () => {
    const component = await mountRoleUpdate()

    await selectRole(component, 'Admin')

    expect(
      component.get('button[type="submit"]').attributes('aria-label'),
    ).toBe('actions.save')
  })

  it('Should update the member with the picked role', async () => {
    const component = await mountRoleUpdate()

    await selectRole(component, 'Admin')
    await submitForm(component)

    expect(updateTeamMember).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { role: 'Admin' },
        id: member.id,
        campaign: mockCampaignFull.id,
      }),
    )
  })

  it('Should not update an unknown role', async () => {
    const component = await mountRoleUpdate()

    await selectRole(component, 'Owner')
    await submitForm(component)

    expect(updateTeamMember).not.toHaveBeenCalled()
  })

  it('Should show the error the mutation reports', async () => {
    const component = await mountRoleUpdate()

    await selectRole(component, 'Admin')
    await submitForm(component)

    updateOptions().onError('Update failed')
    await nextTick()

    expect(component.text()).toContain('Update failed')
  })

  it('Should offer the admin role when the owner is on pro', async () => {
    const component = await mountRoleUpdate()

    expect(adminOption(component).attributes('disabled')).toBeUndefined()
    expect(adminOption(component).text()).not.toContain('general.pro')
  })

  it('Should lock the admin role behind pro for a free owner', async () => {
    const component = await mountRoleUpdate({}, false)

    expect(adminOption(component).attributes('disabled')).toBeDefined()
    expect(adminOption(component).text()).toContain('general.pro')
  })

  it('Should keep an existing admin selectable for a free owner', async () => {
    const component = await mountRoleUpdate({ role: 'Admin' }, false)

    expect(adminOption(component).attributes('disabled')).toBeUndefined()
  })
})
