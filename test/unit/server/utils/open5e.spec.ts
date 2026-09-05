import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import {
  fetchOpen5e,
  isOpen5eUnavailable,
  open5eErrorToH3Error,
} from '~~/server/utils/open5e'

function params(url: string): URLSearchParams {
  return new URL(url).searchParams
}

function withStatus(status: number): Error {
  return Object.assign(new Error('upstream failed'), { status })
}

function timeoutError(): Error {
  const error = new Error('[TimeoutError]: The operation was aborted')
  error.name = 'TimeoutError'

  return error
}

describe('open5eErrorToH3Error', () => {
  it('reports a timeout as a gateway timeout', () => {
    expect(open5eErrorToH3Error(timeoutError())).toMatchObject({
      statusCode: 504,
      statusMessage: 'Open5e did not respond in time',
    })
  })

  it('unwraps a timeout that ofetch wrapped in a fetch error', () => {
    const wrapped = new Error('[GET] failed', { cause: timeoutError() })

    expect(open5eErrorToH3Error(wrapped)).toMatchObject({ statusCode: 504 })
  })

  it('passes an upstream 404 through', () => {
    expect(open5eErrorToH3Error(withStatus(404))).toMatchObject({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
  })

  it('reports an upstream server error as a bad gateway', () => {
    expect(open5eErrorToH3Error(withStatus(503))).toMatchObject({
      statusCode: 502,
      statusMessage: 'Open5e returned an invalid response',
      data: { upstreamStatus: 503 },
    })
  })

  it('reports an upstream client error as our own bad request', () => {
    expect(open5eErrorToH3Error(withStatus(400))).toMatchObject({
      statusCode: 400,
      statusMessage: 'Bad Request',
      data: { upstreamStatus: 400 },
    })
  })

  it('reports a connection failure as unavailable', () => {
    expect(open5eErrorToH3Error(new Error('fetch failed'))).toMatchObject({
      statusCode: 503,
      statusMessage: 'Open5e is unavailable',
    })
  })

  it('reports a non-error rejection as unavailable', () => {
    expect(open5eErrorToH3Error(undefined)).toMatchObject({ statusCode: 503 })
  })
})

describe('isOpen5eUnavailable', () => {
  it('treats the whole upstream failure family as recoverable from cache', () => {
    for (const statusCode of [502, 503, 504]) {
      expect(isOpen5eUnavailable({ statusCode })).toBe(true)
    }
  })

  it('does not serve stale data for a request we got wrong', () => {
    for (const statusCode of [400, 404, 429, 500]) {
      expect(isOpen5eUnavailable({ statusCode })).toBe(false)
    }
  })

  it('recognises the errors its own mapper produces', () => {
    expect(isOpen5eUnavailable(open5eErrorToH3Error(timeoutError()))).toBe(true)
    expect(isOpen5eUnavailable(open5eErrorToH3Error(withStatus(503)))).toBe(
      true,
    )
    expect(
      isOpen5eUnavailable(open5eErrorToH3Error(new Error('fetch failed'))),
    ).toBe(true)
    expect(isOpen5eUnavailable(open5eErrorToH3Error(withStatus(404)))).toBe(
      false,
    )
    expect(isOpen5eUnavailable(open5eErrorToH3Error(withStatus(400)))).toBe(
      false,
    )
  })

  it('handles values that are not errors at all', () => {
    expect(isOpen5eUnavailable(undefined)).toBe(false)
    expect(isOpen5eUnavailable(null)).toBe(false)
    expect(isOpen5eUnavailable('503')).toBe(false)
    expect(isOpen5eUnavailable({ statusCode: '503' })).toBe(false)
  })
})

describe('fetchOpen5e', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('returns the upstream payload', async () => {
    const response = { count: 1, next: null, previous: null, results: [{}] }

    mockFetch.mockResolvedValue(response)

    await expect(fetchOpen5e('spells', { page: 1 })).resolves.toBe(response)
  })

  it('applies the exclude list for the type and fails fast', async () => {
    mockFetch.mockResolvedValue({ results: [] })

    await fetchOpen5e('monsters', { page: 1 })

    const [url, options] = mockFetch.mock.calls[0]!

    expect(params(url).get('exclude')).toBe(
      'document,speed,saving_throws,skill_bonuses,subcategory,creaturesets,environments,illustration',
    )
    expect(options).toEqual({ timeout: 8000, retry: false })
  })

  it('lets the caller override the exclude list', async () => {
    mockFetch.mockResolvedValue({ results: [] })

    await fetchOpen5e('spells', { exclude: 'document,desc' })

    expect(params(mockFetch.mock.calls[0]![0]).get('exclude')).toBe(
      'document,desc',
    )
  })

  it('sends no exclude list for documents', async () => {
    mockFetch.mockResolvedValue({ results: [] })

    await fetchOpen5e('documents', { ordering: '-publication_date' })

    expect(params(mockFetch.mock.calls[0]![0]).has('exclude')).toBe(false)
  })

  it('normalises an upstream failure', async () => {
    mockFetch.mockRejectedValue(timeoutError())

    await expect(fetchOpen5e('spells', { page: 1 })).rejects.toMatchObject({
      statusCode: 504,
    })
  })

  it('does not normalise an unsupported type into a gateway error', async () => {
    await expect(fetchOpen5e('races' as Open5eType, {})).rejects.toMatchObject({
      statusCode: 400,
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
