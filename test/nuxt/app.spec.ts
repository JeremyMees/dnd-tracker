import {
  mockComponent,
  mockNuxtImport,
  mountSuspended,
} from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '~/app.vue'

const { useConfirmDialogsMock, useHealthCheckMock, routeMock } = vi.hoisted(
  () => ({
    useConfirmDialogsMock: vi.fn(),
    useHealthCheckMock: vi.fn(),
    routeMock: {
      name: 'index' as string | undefined,
      meta: {},
      path: '/',
      fullPath: '/',
      query: {},
      params: {},
      hash: '',
      matched: [],
    },
  }),
)

mockNuxtImport('useConfirmDialogs', () => useConfirmDialogsMock)
mockNuxtImport('useHealthCheck', () => useHealthCheckMock)
mockNuxtImport('useRoute', () => () => routeMock)

mockComponent('ConfirmDialog', {
  props: ['uuid', 'title'],
  template: '<div test-id="confirm-dialog">{{ title }}</div>',
})

const stubs = {
  NuxtRouteAnnouncer: { template: '<div test-id="route-announcer" />' },
  NuxtPage: { template: '<div test-id="nuxt-page" />' },
  ModalGroup: { template: '<div test-id="modal-group" />' },
}

describe('app', async () => {
  beforeEach(() => {
    routeMock.name = 'index'

    useConfirmDialogsMock.mockReturnValue({
      dialogs: ref([]),
      handlers: { confirm: vi.fn(), decline: vi.fn() },
    })
  })

  it('Should match snapshot', async () => {
    const component = await mountSuspended(App, { global: { stubs } })

    expect(component.html()).toMatchSnapshot()
  })

  it('Should render a skip link to the main content', async () => {
    const component = await mountSuspended(App, { global: { stubs } })

    const skip = component.get('[test-id="skip-to-content"]')

    expect(skip.attributes('href')).toBe('#main-content')
    expect(skip.text()).toBe('actions.skipToContent')
  })

  it('Should run the health check', async () => {
    await mountSuspended(App, { global: { stubs } })

    expect(useHealthCheckMock).toHaveBeenCalled()
  })

  it('Should render the nuxt page', async () => {
    const component = await mountSuspended(App, { global: { stubs } })

    expect(component.find('[test-id="nuxt-page"]').exists()).toBe(true)
  })

  it('Should not apply the highlighted background class for a regular page', async () => {
    routeMock.name = 'index'

    const component = await mountSuspended(App, { global: { stubs } })

    expect(
      component.get('[test-id="nuxt-page"]').element.parentElement?.className,
    ).not.toContain('bg-primary/10')
  })

  it.each(['profile', 'pricing', 'updates-feature-request'])(
    'Should apply the highlighted background class for the %s page',
    async name => {
      routeMock.name = name

      const component = await mountSuspended(App, { global: { stubs } })

      expect(
        component.get('[test-id="nuxt-page"]').element.parentElement?.className,
      ).toContain('bg-primary/10')
    },
  )

  it('Should apply the highlighted background class when the localized route name matches', async () => {
    routeMock.name = 'profile___en'

    const component = await mountSuspended(App, { global: { stubs } })

    expect(
      component.get('[test-id="nuxt-page"]').element.parentElement?.className,
    ).toContain('bg-primary/10')
  })

  it('Should not throw when the route has no name', async () => {
    routeMock.name = undefined

    await expect(
      mountSuspended(App, { global: { stubs } }),
    ).resolves.toBeDefined()
  })

  it('Should render one entry per open dialog', async () => {
    useConfirmDialogsMock.mockReturnValue({
      dialogs: ref([
        {
          uuid: '1',
          title: 'First',
          description: 'First description',
          confirmText: 'Yes',
          declineText: 'No',
          callback: vi.fn(),
        },
        {
          uuid: '2',
          title: 'Second',
          description: 'Second description',
          confirmText: 'Yes',
          declineText: 'No',
          callback: vi.fn(),
        },
      ]),
      handlers: { confirm: vi.fn(), decline: vi.fn() },
    })

    const component = await mountSuspended(App, { global: { stubs } })

    await vi.waitFor(() =>
      expect(
        component
          .findAll('[test-id="confirm-dialog"]')
          .map(dialog => dialog.text()),
      ).toEqual(['First', 'Second']),
    )
  })

  it('Should not render a dialog when none are open', async () => {
    const component = await mountSuspended(App, { global: { stubs } })

    expect(component.find('[test-id="confirm-dialog"]').exists()).toBe(false)
  })
})
