import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LiveSessionPanel from '~/components/initiative/LiveSessionPanel.vue'
import { authUser } from '~~/test/fixtures/auth-user'
import { sheet } from '~~/test/fixtures/initiative-sheet'
import { createInitiativeSheetProvide } from '~~/test/nuxt/stubs/initiative'

const { ask, toast, mockClipboard, start, stop } = vi.hoisted(() => ({
  ask: vi.fn(),
  toast: vi.fn(),
  mockClipboard: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}))

vi.mock('~/components/ui/toast', () => ({
  useToast: () => ({ toast }),
}))

const user = ref<AuthUser>({ ...authUser })
const session = ref<{ token: string; code: string; expiresAt: string }>()
const active = ref(false)
const loading = ref(false)

mockNuxtImport('useAuthenticatedUser', () => () => user)
mockNuxtImport('useConfirm', () => () => ({ ask }))
mockNuxtImport('useClipboard', () => () => ({ copy: mockClipboard }))
mockNuxtImport('useLiveSession', () => () => ({
  session,
  active,
  loading,
  start,
  stop,
}))
mockNuxtImport('useLiveSeats', () => () => ({
  seats: ref([]),
  connected: ref(new Set()),
  kick: vi.fn(),
  reassign: vi.fn(),
}))

const props = { encounterId: 1 }

function mountPanel(sheetOverride: InitiativeSheet = sheet) {
  const injected = createInitiativeSheetProvide(sheetOverride)

  return {
    injected,
    mount: () =>
      mountSuspended(LiveSessionPanel, { props, provide: injected.provide }),
  }
}

describe('LiveSessionPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    user.value = { ...authUser, subscriptionType: 'free' }
    session.value = undefined
    active.value = false
    loading.value = false
  })

  it('Should show the upsell when the user is not pro', async () => {
    const component = await mountPanel().mount()

    expect(component.find('[test-id="upsell"]').exists()).toBe(true)
    expect(start).not.toHaveBeenCalled()
  })

  it('Should check for a session on mount without creating one', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    await mountPanel().mount()

    expect(start).toHaveBeenCalledWith({ createIfMissing: false })
  })

  it('Should show a loading state while the initial session lookup is pending', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    loading.value = true

    const component = await mountPanel().mount()

    expect(component.find('[test-id="loading"]').exists()).toBe(true)
  })

  it('Should show a start button when pro but no session is active', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const component = await mountPanel().mount()

    expect(component.find('[test-id="start"]').exists()).toBe(true)
  })

  it('Should create a session when the start button is clicked', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }

    const component = await mountPanel().mount()

    start.mockClear()

    await component.get('[test-id="start"] button').trigger('click')

    expect(start).toHaveBeenCalledWith()
  })

  it('Should show the QR code, room code and expiry when a session is active', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel().mount()

    expect(component.find('[test-id="active"]').exists()).toBe(true)
    expect(component.find('[test-id="qr-code"]').exists()).toBe(true)
    expect(component.find('[test-id="code"]').text()).toBe('ABC123')
    expect(component.find('[test-id="expires"]').exists()).toBe(true)
  })

  it('Should copy the join link and toast on copy', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel().mount()

    await component.find('[test-id="copy-link"]').trigger('click')

    expect(mockClipboard).toHaveBeenCalledWith(
      expect.stringContaining('/live?code=ABC123'),
    )
    expect(toast).toHaveBeenCalledWith({
      description: 'actions.copyClipboard',
      variant: 'info',
    })
  })

  it('Should ask for confirmation and stop the session when ending it', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel().mount()

    await component.find('[test-id="end"]').trigger('click')

    expect(ask).toHaveBeenCalledWith(
      {
        title: 'components.liveSession.endConfirm.title',
        description: 'components.liveSession.endConfirm.text',
      },
      expect.any(Function),
    )

    const callback = ask.mock.calls[0]?.[1]
    await callback(true)

    expect(stop).toHaveBeenCalled()
  })

  it('Should not stop the session when the confirmation is declined', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel().mount()

    await component.find('[test-id="end"]').trigger('click')

    const callback = ask.mock.calls[0]?.[1]
    await callback(false)

    expect(stop).not.toHaveBeenCalled()
  })

  it('Should reflect the current hideMonsterNames/hideMonsterHealth/hideMonsterAc settings', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel({
      ...sheet,
      settings: {
        ...sheet.settings!,
        live: {
          hideMonsterNames: true,
          hideMonsterHealth: false,
          hideMonsterAc: true,
        },
      },
    }).mount()

    expect(
      component.find('[test-id="hide-monster-names"]').attributes('data-state'),
    ).toBe('checked')
    expect(
      component
        .find('[test-id="hide-monster-health"]')
        .attributes('data-state'),
    ).toBe('unchecked')
    expect(
      component.find('[test-id="hide-monster-ac"]').attributes('data-state'),
    ).toBe('checked')
  })

  it('Should toggle hideMonsterNames without wiping other live settings', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const withLive = {
      ...sheet,
      settings: {
        ...sheet.settings!,
        live: { hideMonsterHealth: true },
      },
    }
    const { injected, mount } = mountPanel(withLive)
    const component = await mount()

    await component.find('[test-id="hide-monster-names"]').trigger('click')

    expect(injected.update).toHaveBeenCalledWith({
      settings: {
        ...withLive.settings,
        live: { hideMonsterHealth: true, hideMonsterNames: true },
      },
    })
  })

  it('Should reflect the current settings.live.allow settings', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const component = await mountPanel({
      ...sheet,
      settings: {
        ...sheet.settings!,
        live: { allow: { hp: false, conditions: false } },
      },
    }).mount()

    expect(
      component.find('[test-id="allow-hp"]').attributes('data-state'),
    ).toBe('unchecked')
    expect(
      component.find('[test-id="allow-ac"]').attributes('data-state'),
    ).toBe('checked')
    expect(
      component.find('[test-id="allow-death-saves"]').attributes('data-state'),
    ).toBe('checked')
    expect(
      component
        .find('[test-id="allow-concentration"]')
        .attributes('data-state'),
    ).toBe('checked')
    expect(
      component.find('[test-id="allow-conditions"]').attributes('data-state'),
    ).toBe('unchecked')
  })

  it('Should toggle an allow setting without wiping other live settings', async () => {
    user.value = { ...authUser, subscriptionType: 'pro' }
    session.value = {
      token: 'jwt',
      code: 'ABC123',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    active.value = true

    const withLive = {
      ...sheet,
      settings: {
        ...sheet.settings!,
        live: { hideMonsterHealth: true, allow: { hp: false } },
      },
    }
    const { injected, mount } = mountPanel(withLive)
    const component = await mount()

    await component.find('[test-id="allow-conditions"]').trigger('click')

    expect(injected.update).toHaveBeenCalledWith({
      settings: {
        ...withLive.settings,
        live: {
          hideMonsterHealth: true,
          allow: { hp: false, conditions: false },
        },
      },
    })
  })
})
