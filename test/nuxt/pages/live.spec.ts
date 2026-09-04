import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Live from '~/pages/live.vue'
import { playerSheet } from '~~/test/fixtures/player-portal'
import { nuxtLayoutStub } from '~~/test/nuxt/stubs/layout'

const { getQueryData, useLiveRealtime, useSeo } = vi.hoisted(() => ({
  getQueryData: vi.fn(),
  useLiveRealtime: vi.fn(),
  useSeo: vi.fn(),
}))

vi.mock('@tanstack/vue-query', async importOriginal => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useQueryClient: () => ({ getQueryData }),
}))

mockNuxtImport('useLiveRealtime', () => useLiveRealtime)

const liveState = ref<LiveStateResponse>()
const isPending = ref(false)
const isError = ref(false)
const stateError = ref<{ statusCode?: number } | null>(null)

vi.mock('~/queries/live', () => ({
  useLiveState: () => ({
    data: liveState,
    isPending,
    isError,
    error: stateError,
  }),
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

const PlayerViewProbe = defineComponent({
  props: ['sheet', 'loading', 'error'],
  template: '<div test-id="player-view-probe" />',
})

const stubs = {
  NuxtLayout: nuxtLayoutStub,
  FormLiveJoinCode: CodeFormProbe,
  FormLiveJoin: JoinFormProbe,
  LivePlayerView: PlayerViewProbe,
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

const joinedSession = {
  sessionToken: 'session-token',
  seatToken: 'seat-token',
  seat: 'seat-1',
  row: 'row-1',
  spectator: false,
  code: 'ABC234',
  expiresAt: 'later',
  uuid: 'session-uuid',
}

describe('Live page', () => {
  beforeEach(() => {
    query.value = {}
    localStorage.clear()
    liveState.value = undefined
    isPending.value = false
    isError.value = false
    stateError.value = null
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

  it('renders the live player view in the simple layout and stores the seat once joined', async () => {
    query.value = { code: 'ABC234' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode' ? codeSession : undefined,
    )

    const component = await mountPage()

    component.findComponent(JoinFormProbe).vm.$emit('joined', joinedSession)
    await nextTick()

    expect(component.find('[test-id="simple"]').exists()).toBe(true)
    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem('live-seat')!)).toEqual(
      joinedSession,
    )
  })

  it('wires the realtime subscription to the joined session', async () => {
    query.value = { code: 'ABC234' }
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode' ? codeSession : undefined,
    )

    const component = await mountPage()

    expect(useLiveRealtime).toHaveBeenCalledTimes(1)

    const [tokenArg, uuidArg, seatTokenArg, seatIdArg, ownRowArg] =
      useLiveRealtime.mock.calls[0]!

    expect(tokenArg.value).toBeUndefined()
    expect(uuidArg.value).toBeUndefined()
    expect(seatTokenArg.value).toBeUndefined()
    expect(seatIdArg.value).toBeUndefined()
    expect(ownRowArg.value).toBeUndefined()

    component.findComponent(JoinFormProbe).vm.$emit('joined', joinedSession)
    await nextTick()

    expect(tokenArg.value).toBe('session-token')
    expect(uuidArg.value).toBe('session-uuid')
    expect(seatTokenArg.value).toBe('seat-token')
    expect(seatIdArg.value).toBe('seat-1')
    expect(ownRowArg.value).toBe('row-1')
  })

  it('passes the fetched sheet and query state to the live player view', async () => {
    liveState.value = {
      sheet: playerSheet,
      session: {
        code: 'ABC234',
        expiresAt: 'later',
        version: 1,
        kicked: false,
      },
    }
    isPending.value = true
    isError.value = true

    const component = await mountPage()

    component.findComponent(CodeFormProbe).vm.$emit('validated', codeSession)
    await nextTick()

    component.findComponent(JoinFormProbe).vm.$emit('joined', joinedSession)
    await nextTick()

    const view = component.findComponent(PlayerViewProbe)

    expect(view.props('sheet')).toEqual(playerSheet)
    expect(view.props('loading')).toBe(true)
    expect(view.props('error')).toBe(true)
  })

  it('resumes a previously joined seat on mount when there is no query code', async () => {
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)
    expect(component.findComponent(CodeFormProbe).exists()).toBe(false)
    expect(getQueryData).not.toHaveBeenCalled()

    const [tokenArg, uuidArg, seatTokenArg, seatIdArg, ownRowArg] =
      useLiveRealtime.mock.calls[0]!

    expect(tokenArg.value).toBe('session-token')
    expect(uuidArg.value).toBe('session-uuid')
    expect(seatTokenArg.value).toBe('seat-token')
    expect(seatIdArg.value).toBe('seat-1')
    expect(ownRowArg.value).toBe('row-1')
  })

  it('resumes a previously joined seat when the query code matches the stored seat', async () => {
    query.value = { code: 'ABC234' }
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)
    expect(getQueryData).not.toHaveBeenCalled()
  })

  it('ignores a stored seat for a different query code', async () => {
    query.value = { code: 'ZZZZZZ' }
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))
    getQueryData.mockImplementation((key: string[]) =>
      key[0] === 'useLiveCode' ? { ...codeSession, code: 'ZZZZZZ' } : undefined,
    )

    const component = await mountPage()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(false)
    expect(component.findComponent(JoinFormProbe).exists()).toBe(true)
    expect(component.findComponent(JoinFormProbe).props('code')).toBe('ZZZZZZ')
  })

  it('clears the stored seat and shows the ended screen once the live session has ended', async () => {
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)

    stateError.value = { statusCode: 410 }
    isError.value = true
    await nextTick()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(false)
    expect(component.findComponent(CodeFormProbe).exists()).toBe(false)
    expect(component.get('[test-id="ended"]').text()).toContain(
      'pages.live.ended.title',
    )
    expect(localStorage.getItem('live-seat')).toBeNull()
  })

  it('returns to the code form from the ended screen', async () => {
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    stateError.value = { statusCode: 410 }
    isError.value = true
    await nextTick()

    await component.get('[test-id="ended-action"]').trigger('click')

    expect(component.find('[test-id="ended"]').exists()).toBe(false)
    expect(component.findComponent(CodeFormProbe).exists()).toBe(true)
  })

  it('leaves the joined view untouched for a transient error', async () => {
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    stateError.value = { statusCode: 500 }
    isError.value = true
    await nextTick()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)
    expect(JSON.parse(localStorage.getItem('live-seat')!)).toEqual(
      joinedSession,
    )
  })

  it('clears the stored seat and shows the ended screen once the seat is kicked', async () => {
    localStorage.setItem('live-seat', JSON.stringify(joinedSession))

    const component = await mountPage()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(true)

    liveState.value = {
      sheet: playerSheet,
      session: { code: 'ABC234', expiresAt: 'later', version: 1, kicked: true },
    }
    await nextTick()

    expect(component.findComponent(PlayerViewProbe).exists()).toBe(false)
    expect(component.get('[test-id="ended"]').text()).toContain(
      'pages.live.ended.title',
    )
    expect(localStorage.getItem('live-seat')).toBeNull()
  })
})
