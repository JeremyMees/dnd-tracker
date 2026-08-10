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

const CodeFormProbe = defineComponent({
  props: ['initialCode', 'initialErrorStatus'],
  emits: ['validated'],
  template: '<div test-id="code-form-probe" />',
})

const JoinFormProbe = defineComponent({
  props: ['code', 'rows'],
  emits: ['joined'],
  template: '<div test-id="join-form-probe" />',
})

const stubs = {
  NuxtLayout: nuxtLayoutStub,
  FormLiveJoinCode: CodeFormProbe,
  FormLiveJoin: JoinFormProbe,
}

async function mountPage() {
  const component = await mountSuspended(Live, { global: { stubs } })

  await nextTick()

  return component
}

const codeSession = {
  code: 'ABC234',
  expiresAt: 'later',
  rows: [{ id: 'row-1', name: 'Elara', type: 'player' }],
}

describe('Live page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.value = {}
    localStorage.clear()
  })

  it('sets the page seo', async () => {
    await mountPage()

    expect(useSeo).toHaveBeenCalledWith('Live')
  })

  it('renders the code-entry form when there is no code in the query', async () => {
    const component = await mountPage()

    expect(component.findComponent(CodeFormProbe).exists()).toBe(true)
    expect(component.findComponent(JoinFormProbe).exists()).toBe(false)
    expect(getQueryData).not.toHaveBeenCalled()
  })

  it('renders the join form when a cached session exists for the query code', async () => {
    query.value = { code: 'ABC234' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode' ? codeSession : undefined,
    )

    const component = await mountPage()
    const form = component.findComponent(JoinFormProbe)

    expect(getQueryData).toHaveBeenCalledWith(['useLiveCode', 'ABC234'])
    expect(form.exists()).toBe(true)
    expect(form.props('code')).toBe('ABC234')
    expect(form.props('rows')).toEqual(codeSession.rows)
  })

  it('passes the cached error status to the code form when validation failed', async () => {
    query.value = { code: 'ZZZZZZ' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCodeError' ? 410 : undefined,
    )

    const component = await mountPage()
    const form = component.findComponent(CodeFormProbe)

    expect(form.props('initialErrorStatus')).toBe(410)
    expect(form.props('initialCode')).toBe('ZZZZZZ')
  })

  it('renders the join form once the code form emits validated', async () => {
    const component = await mountPage()

    component.findComponent(CodeFormProbe).vm.$emit('validated', codeSession)
    await nextTick()

    const form = component.findComponent(JoinFormProbe)

    expect(form.exists()).toBe(true)
    expect(form.props('code')).toBe('ABC234')
  })

  it('shows the joined state and stores the seat once the join form emits joined', async () => {
    query.value = { code: 'ABC234' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode' ? codeSession : undefined,
    )

    const session = {
      sessionToken: 'session-token',
      seatToken: 'seat-token',
      seat: 'seat-1',
      row: 'row-1',
      spectator: false,
      code: 'ABC234',
      expiresAt: 'later',
    }

    const component = await mountPage()

    component.findComponent(JoinFormProbe).vm.$emit('joined', session)
    await nextTick()

    expect(component.find('[test-id="joined"]').exists()).toBe(true)
    expect(component.text()).toContain('ABC234')
    expect(JSON.parse(localStorage.getItem('live-seat')!)).toEqual(session)
  })
})
