import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { open5eUrl, requestOpen5e } from '~~/shared/utils/open5e-request'

function params(url: string): URLSearchParams {
  return new URL(url).searchParams
}

describe('open5eUrl', () => {
  it('maps monsters onto the creatures resource', () => {
    expect(open5eUrl('monsters', {})).toBe(
      'https://api.open5e.com/v2/creatures/',
    )
  })

  it('maps every remaining type onto its own resource', () => {
    expect(open5eUrl('spells', {})).toBe('https://api.open5e.com/v2/spells/')
    expect(open5eUrl('conditions', {})).toBe(
      'https://api.open5e.com/v2/conditions/',
    )
    expect(open5eUrl('magicitems', {})).toBe(
      'https://api.open5e.com/v2/magicitems/',
    )
    expect(open5eUrl('weapons', {})).toBe('https://api.open5e.com/v2/weapons/')
    expect(open5eUrl('armor', {})).toBe('https://api.open5e.com/v2/armor/')
    expect(open5eUrl('documents', {})).toBe(
      'https://api.open5e.com/v2/documents/',
    )
  })

  it('drops params that carry no filter', () => {
    const query = params(
      open5eUrl('spells', {
        page: 1,
        name__icontains: '',
        cr: null,
        ordering: undefined,
      }),
    )

    expect([...query.keys()]).toEqual(['page'])
  })

  it('keeps falsy values that are still meaningful', () => {
    const query = params(open5eUrl('spells', { page: 0, exclude: false }))

    expect(query.get('page')).toBe('0')
    expect(query.get('exclude')).toBe('false')
  })

  it('sorts params so the same filters always produce the same url', () => {
    const a = open5eUrl('spells', { page: 1, limit: 20, ordering: 'name' })
    const b = open5eUrl('spells', { ordering: 'name', page: 1, limit: 20 })

    expect(a).toBe(b)
    expect(a).toContain('?limit=20&ordering=name&page=1')
  })

  it('rejects an unsupported type', () => {
    expect(() => open5eUrl('races' as Open5eType, {})).toThrowError(
      'Unsupported open5e type: races',
    )
  })
})

describe('requestOpen5e', () => {
  const nativeFetch = globalThis.fetch
  const mock = vi.fn()

  beforeEach(() => {
    mock.mockReset()
    globalThis.fetch = mock as unknown as typeof globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = nativeFetch
  })

  it('returns the parsed payload', async () => {
    const payload = { count: 1, next: null, previous: null, results: [{}] }

    mock.mockResolvedValue({ ok: true, json: async () => payload })

    await expect(requestOpen5e('spells', { page: 1 })).resolves.toEqual(payload)
    expect(params(mock.mock.calls[0]![0]).get('page')).toBe('1')
  })

  it('aborts on a timeout the error mapper can recognise', async () => {
    mock.mockResolvedValue({ ok: true, json: async () => ({}) })

    await requestOpen5e('spells', {}, 1234)

    expect(mock.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal)
  })

  it('throws with the upstream status attached', async () => {
    mock.mockResolvedValue({ ok: false, status: 503 })

    await expect(requestOpen5e('spells', {})).rejects.toMatchObject({
      status: 503,
    })
  })

  it('does not reach the network for an unsupported type', async () => {
    await expect(requestOpen5e('races' as Open5eType, {})).rejects.toThrowError(
      'Unsupported open5e type: races',
    )

    expect(mock).not.toHaveBeenCalled()
  })
})
