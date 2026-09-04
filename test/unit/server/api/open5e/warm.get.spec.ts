import { beforeEach, describe, expect, it } from 'vitest'
import { mockFetch } from '~~/test/unit/stubs/fetch'
import { mockRuntimeConfig } from '~~/test/unit/stubs/runtime-config'
import { mockEvent, responseHeader } from '~~/test/unit/stubs/api-event'
import handler from '~~/server/api/open5e/warm.get'

const SECRET = 'a-very-random-cron-secret'

function cronEvent(authorization = `Bearer ${SECRET}`) {
  return mockEvent({ headers: { authorization } })
}

function warmedPaths() {
  return mockFetch.mock.calls.map(([path]) => path)
}

function warmedQueries() {
  return mockFetch.mock.calls.map(([, options]) => options?.query)
}

describe('GET /api/open5e/warm', () => {
  beforeEach(() => {
    mockFetch.mockReset().mockResolvedValue({})
    mockRuntimeConfig({ public: {}, cronSecret: SECRET })
  })

  describe('authorisation', () => {
    it('accepts the bearer token vercel sends', async () => {
      await expect(handler(cronEvent())).resolves.toMatchObject({ failed: 0 })
    })

    it('rejects a request with no authorization header', async () => {
      await expect(handler(mockEvent())).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects a wrong secret', async () => {
      await expect(handler(cronEvent('Bearer nope'))).rejects.toMatchObject({
        statusCode: 401,
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects a bare token without the bearer prefix', async () => {
      await expect(handler(cronEvent(SECRET))).rejects.toMatchObject({
        statusCode: 401,
      })
    })

    it('fails closed when no secret is configured', async () => {
      mockRuntimeConfig({ public: {} })

      await expect(handler(cronEvent())).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'CRON_SECRET is not configured',
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('warming', () => {
    it('warms every default view a visitor lands on', async () => {
      const result = await handler(cronEvent())

      expect(warmedPaths()).toEqual([
        '/api/open5e/documents',
        '/api/open5e/conditions',
        '/api/open5e/listing',
        '/api/open5e/listing',
        '/api/open5e/listing',
        '/api/open5e/listing',
        '/api/open5e/listing',
        '/api/open5e/listing',
      ])
      expect(result.warmed).toBe(8)
    })

    it('covers every content type the ui can show', async () => {
      await handler(cronEvent())

      const types = warmedQueries()
        .filter(Boolean)
        .map(query => (query as { type: string }).type)

      expect(types).toEqual([
        'spells',
        'monsters',
        'conditions',
        'magicitems',
        'weapons',
        'armor',
      ])
    })

    it('asks for exactly the filters the components default to', async () => {
      await handler(cronEvent())

      expect(warmedQueries().filter(Boolean)[0]).toEqual({
        type: 'spells',
        page: 0,
        search: '',
        documents: 'srd-2024',
        ordering: 'name',
      })
    })

    it('reports a partial failure without abandoning the rest', async () => {
      mockFetch
        .mockResolvedValue({})
        .mockRejectedValueOnce({ data: { statusMessage: 'Open5e is down' } })

      const result = await handler(cronEvent())

      expect(result).toMatchObject({ warmed: 7, failed: 1 })
      expect(result.results[0]).toEqual({
        target: 'documents',
        ok: false,
        error: 'Open5e is down',
      })
    })

    it('still resolves when open5e is down entirely', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'Open5e down' } })

      const result = await handler(cronEvent())

      expect(result).toMatchObject({ warmed: 0, failed: 8 })
    })

    it('is never itself cached', async () => {
      const event = cronEvent()

      await handler(event)

      expect(responseHeader(event, 'Cache-Control')).toBe('no-store')
    })
  })
})
