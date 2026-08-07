import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Join from '~/pages/campaigns/join.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { fetchMock, getQueryData, navigateTo, removeQueries, toast, useSeo } =
  vi.hoisted(() => ({
    fetchMock: vi.fn(),
    getQueryData: vi.fn(),
    navigateTo: vi.fn(),
    removeQueries: vi.fn(),
    toast: vi.fn(),
    useSeo: vi.fn(),
  }))

vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData, removeQueries }),
}))

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('navigateTo', () => navigateTo)
mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useRequestHeaders', () => () => ({ cookie: 'session=abc' }))
mockNuxtImport('useRoute', () => () => ({
  path: '/campaigns/join',
  params: {},
  query: { token: 'invite-token' },
}))

const stubs = { NuxtLayout: nuxtLayoutStub }

const invite = {
  campaign: { id: 1, title: 'Curse of Strahd' },
  role: 'Admin' as UserRole,
  user: 'user-1',
}

async function mountPage() {
  const component = await mountSuspended(Join, { global: { stubs } })

  await flushPromises()

  return {
    component,
    async join() {
      await component.get('[test-id="join"]').trigger('click')
      await flushPromises()
    },
    async decline() {
      await component.get('[test-id="decline"]').trigger('click')
      await flushPromises()
    },
  }
}

describe('Campaign join page', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    fetchMock.mockResolvedValue(undefined)
    getQueryData.mockReturnValue({ ...invite })
  })

  it('Should set the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Join campaign')
  })

  it('Should render inside the centered layout', async () => {
    const { component } = await mountPage()

    expect(component.get('[test-id]').attributes('test-id')).toBe('centered')
  })

  it('Should read the invite from the cache of the token', async () => {
    const { component } = await mountPage()

    expect(getQueryData).toHaveBeenCalledWith([
      'useJoinCampaign',
      'invite-token',
    ])
    expect(component.get('[test-id="text"]').text()).toContain(
      invite.campaign.title,
    )
    expect(component.get('[test-id="text"]').text()).toContain(
      'general.roles.Admin.title',
    )
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should redirect when the token has no cached invite', async () => {
    getQueryData.mockReturnValue(undefined)

    const { component } = await mountPage()

    expect(navigateTo).toHaveBeenCalledWith('/no-access')
    expect(component.get('[test-id="text"]').text()).not.toContain(
      invite.campaign.title,
    )
  })

  it('Should enable the actions once the invite is loaded', async () => {
    const { component } = await mountPage()

    expect(
      component.get('[test-id="join"]').attributes('disabled'),
    ).toBeUndefined()
    expect(
      component.get('[test-id="decline"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('Should accept the invite with the token', async () => {
    const { join } = await mountPage()

    await join()

    expect(fetchMock).toHaveBeenCalledWith('/api/campaign/accept-invite', {
      method: 'POST',
      headers: { cookie: 'session=abc' },
      body: { token: 'invite-token' },
    })
  })

  it('Should send to the campaign and toast when the invite is accepted', async () => {
    const { join } = await mountPage()

    await join()

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.campaign.join.toast.accept.title',
      description: 'pages.campaign.join.toast.accept.text',
      variant: 'success',
    })
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['useJoinCampaign', 'invite-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith(
      '/campaigns/1-curse-of-strahd/encounters',
    )
  })

  it('Should decline the invite with the token', async () => {
    const { decline } = await mountPage()

    await decline()

    expect(fetchMock).toHaveBeenCalledWith('/api/campaign/decline-invite', {
      method: 'POST',
      headers: { cookie: 'session=abc' },
      body: { token: 'invite-token' },
    })
  })

  it('Should send home and toast when the invite is declined', async () => {
    const { decline } = await mountPage()

    await decline()

    expect(toast).toHaveBeenCalledWith({
      title: 'pages.campaign.join.toast.decline.title',
      description: 'pages.campaign.join.toast.decline.text',
      variant: 'destructive',
    })
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: ['useJoinCampaign', 'invite-token'],
    })
    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('Should keep the invite and toast when the request fails', async () => {
    fetchMock.mockRejectedValue(new Error('Boom'))

    const { join } = await mountPage()

    await join()

    expect(toast).toHaveBeenCalledWith({
      title: 'general.error.title',
      description: 'general.error.text',
      variant: 'destructive',
    })
    expect(removeQueries).not.toHaveBeenCalled()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('Should answer again after a failed request', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Boom'))

    const { join, component } = await mountPage()

    await join()

    expect(
      component.get('[test-id="join"]').attributes('disabled'),
    ).toBeUndefined()

    await join()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(navigateTo).toHaveBeenCalledWith(
      '/campaigns/1-curse-of-strahd/encounters',
    )
  })

  it('Should not answer when there is no invite', async () => {
    getQueryData.mockReturnValue(undefined)

    const { join } = await mountPage()

    await join()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
