import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LocationQuery } from 'vue-router'
import type { MockInstance } from 'vitest'

const defaults = {
  search: '',
  type: 'spells',
  documents: ['srd-2024'],
  page: 0,
}

const scopes: ReturnType<typeof effectScope>[] = []

let router: ReturnType<typeof useRouter>
let route: ReturnType<typeof useRoute>
let replace: MockInstance

function setup<T extends Record<string, unknown>>(
  key: string,
  values: T,
  options?: UseFilterStateOptions<T>,
) {
  const scope = effectScope()

  scopes.push(scope)

  return scope.run(() => useFilterState(key, values, options))!
}

async function goto(query: LocationQuery): Promise<void> {
  await router.replace({ path: '/', query })
}

async function flush(): Promise<void> {
  await nextTick()
  await Promise.all(replace.mock.results.map(result => result.value))
  await nextTick()
}

describe('useFilterState', () => {
  beforeEach(async () => {
    router = useRouter()
    route = useRoute()

    await goto({})

    replace = vi.spyOn(router, 'replace')
  })

  afterEach(() => {
    scopes.forEach(scope => scope.stop())
    scopes.length = 0
    localStorage.clear()
    sessionStorage.clear()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should start from the defaults without persistence', () => {
    const { state } = setup('test', defaults)

    expect(state).toStrictEqual(defaults)
  })

  it('should not share arrays with the given defaults', () => {
    const { state } = setup('test', defaults)

    state.documents = [...(state.documents as string[]), 'a5e']

    expect(defaults.documents).toStrictEqual(['srd-2024'])
  })

  it('should reset back to the defaults', () => {
    const { state, reset } = setup('test', defaults)

    state.search = 'fire'
    state.page = 3
    reset()

    expect(state).toStrictEqual(defaults)
  })

  it('should not touch the url without persistence', async () => {
    const { state } = setup('test', defaults)

    state.search = 'fire'

    await flush()

    expect(replace).not.toHaveBeenCalled()
  })

  describe('url persistence', () => {
    it('should read the initial state from the query', async () => {
      await goto({ search: 'fire', page: '2', documents: 'srd-2024,a5e' })

      const { state } = setup('test', defaults, { persist: 'url' })

      expect(state).toStrictEqual({
        search: 'fire',
        type: 'spells',
        documents: ['srd-2024', 'a5e'],
        page: 2,
      })
    })

    it('should ignore query values it cannot parse', async () => {
      await goto({ page: 'abc', search: 'fire' })

      const { state } = setup('test', defaults, { persist: 'url' })

      expect(state.page).toBe(0)
      expect(state.search).toBe('fire')
    })

    it('should ignore query keys it does not own', async () => {
      await goto({ unrelated: 'value' })

      const { state } = setup('test', defaults, { persist: 'url' })

      expect(state).toStrictEqual(defaults)
    })

    it('should validate query values against a given codec', async () => {
      await goto({ type: 'nonsense' })

      const { state } = setup('test', defaults, {
        persist: 'url',
        codecs: { type: oneOfFilterCodec(['spells', 'weapons']) },
      })

      expect(state.type).toBe('spells')
    })

    it('should write changed values to the query', async () => {
      const { state } = setup('test', defaults, { persist: 'url' })

      state.search = 'fire'
      state.page = 2

      await flush()

      expect(route.query).toStrictEqual({ search: 'fire', page: '2' })
    })

    it('should collect changes made together into one update', async () => {
      const { state } = setup('test', defaults, { persist: 'url' })

      state.search = 'fire'
      state.page = 2
      state.documents = ['a5e']

      await flush()

      expect(replace).toHaveBeenCalledTimes(1)
    })

    it('should keep values that equal the default out of the query', async () => {
      await goto({ search: 'fire' })

      const { state } = setup('test', defaults, { persist: 'url' })

      state.search = ''

      await flush()

      expect(route.query).toStrictEqual({})
    })

    it('should keep query keys it does not own', async () => {
      await goto({ unrelated: 'value' })

      const { state } = setup('test', defaults, { persist: 'url' })

      state.search = 'fire'

      await flush()

      expect(route.query).toStrictEqual({
        unrelated: 'value',
        search: 'fire',
      })
    })

    it('should serialize arrays as a comma separated list', async () => {
      const { state } = setup('test', defaults, { persist: 'url' })

      state.documents = ['srd-2024', 'a5e']

      await flush()

      expect(route.query).toStrictEqual({ documents: 'srd-2024,a5e' })
    })

    it('should follow the query when it changes elsewhere', async () => {
      const { state } = setup('test', defaults, { persist: 'url' })

      await goto({ search: 'fire', page: '2' })
      await flush()

      expect(state.search).toBe('fire')
      expect(state.page).toBe(2)
      expect(replace).toHaveBeenCalledTimes(1)
      expect(route.query).toStrictEqual({ search: 'fire', page: '2' })
    })

    it('should restore defaults for keys dropped from the query', async () => {
      await goto({ search: 'fire' })

      const { state } = setup('test', defaults, { persist: 'url' })

      await goto({})
      await flush()

      expect(state.search).toBe('')
      expect(route.query).toStrictEqual({})
    })
  })

  describe('storage persistence', () => {
    it('should store changed values', async () => {
      const { state } = setup('test', defaults, { persist: 'local' })

      state.search = 'fire'
      state.documents = ['a5e']

      await flush()

      expect(
        JSON.parse(localStorage.getItem('dnd-tracker:filters:test') ?? '{}'),
      ).toStrictEqual({
        search: 'fire',
        type: 'spells',
        documents: ['a5e'],
        page: 0,
      })
    })

    it('should restore stored values', () => {
      localStorage.setItem(
        'dnd-tracker:filters:test',
        JSON.stringify({ search: 'fire', documents: ['a5e'] }),
      )

      const { state } = setup('test', defaults, { persist: 'local' })

      expect(state).toStrictEqual({
        search: 'fire',
        type: 'spells',
        documents: ['a5e'],
        page: 0,
      })
    })

    it('should drop stored values it cannot use', () => {
      localStorage.setItem(
        'dnd-tracker:filters:test',
        JSON.stringify({
          page: 'abc',
          documents: 'srd-2024',
          unrelated: 'value',
          search: 'fire',
        }),
      )

      const { state } = setup('test', defaults, { persist: 'local' })

      expect(state).toStrictEqual({ ...defaults, search: 'fire' })
    })

    it('should validate stored values against a given codec', () => {
      localStorage.setItem(
        'dnd-tracker:filters:test',
        JSON.stringify({ type: 'nonsense' }),
      )

      const { state } = setup('test', defaults, {
        persist: 'local',
        codecs: { type: oneOfFilterCodec(['spells', 'weapons']) },
      })

      expect(state.type).toBe('spells')
    })

    it('should ignore corrupt storage', () => {
      localStorage.setItem('dnd-tracker:filters:test', 'not json')

      const { state } = setup('test', defaults, { persist: 'local' })

      expect(state).toStrictEqual(defaults)
    })

    it('should keep separate keys apart', async () => {
      const first = setup('first', defaults, { persist: 'local' })
      const second = setup('second', defaults, { persist: 'local' })

      first.state.search = 'fire'

      await flush()

      expect(second.state.search).toBe('')
      expect(localStorage.getItem('dnd-tracker:filters:second')).toContain(
        '"search":""',
      )
    })

    it('should use the session storage when asked', async () => {
      const { state } = setup('test', defaults, { persist: 'session' })

      state.search = 'fire'

      await flush()

      expect(sessionStorage.getItem('dnd-tracker:filters:test')).toContain(
        '"search":"fire"',
      )
      expect(localStorage.getItem('dnd-tracker:filters:test')).toBeNull()
    })

    it('should not touch the url', async () => {
      const { state } = setup('test', defaults, { persist: 'local' })

      state.search = 'fire'

      await flush()

      expect(replace).not.toHaveBeenCalled()
    })
  })
})
