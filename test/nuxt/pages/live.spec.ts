import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Live from '~/pages/live.vue'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { getQueryData, useSeo } = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData }),
}))

const query = ref<Record<string, string>>({})

mockNuxtImport('useSeo', () => useSeo)
mockNuxtImport('useRoute', () => () => ({ query: query.value }))

const FormProbe = defineComponent({
  props: ['initialCode', 'initialErrorStatus'],
  emits: ['validated'],
  template: '<div test-id="form-probe" />',
})

const stubs = { NuxtLayout: nuxtLayoutStub, FormLiveJoinCode: FormProbe }

async function mountPage() {
  const component = await mountSuspended(Live, { global: { stubs } })

  await nextTick()

  return component
}

describe('Live page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.value = {}
  })

  it('sets the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Live')
  })

  it('renders the code-entry form when there is no code in the query', async () => {
    const component = await mountPage()

    expect(component.findComponent(FormProbe).exists()).toBe(true)
    expect(getQueryData).not.toHaveBeenCalled()
  })

  it('shows the confirmed state when a cached session exists for the query code', async () => {
    query.value = { code: 'ABC234' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode'
        ? { code: 'ABC234', expiresAt: 'later' }
        : undefined,
    )

    const component = await mountPage()

    expect(getQueryData).toHaveBeenCalledWith(['useLiveCode', 'ABC234'])
    expect(component.find('[test-id="confirmed"]').exists()).toBe(true)
    expect(component.text()).toContain('ABC234')
  })

  it('passes the cached error status to the form when validation failed', async () => {
    query.value = { code: 'ZZZZZZ' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCodeError' ? 410 : undefined,
    )

    const component = await mountPage()
    const form = component.findComponent(FormProbe)

    expect(form.props('initialErrorStatus')).toBe(410)
    expect(form.props('initialCode')).toBe('ZZZZZZ')
  })

  it('shows the confirmed state once the form emits validated', async () => {
    const component = await mountPage()

    component
      .findComponent(FormProbe)
      .vm.$emit('validated', { code: 'ABC234', expiresAt: 'later' })
    await nextTick()

    expect(component.find('[test-id="confirmed"]').exists()).toBe(true)
    expect(component.text()).toContain('ABC234')
  })
})
