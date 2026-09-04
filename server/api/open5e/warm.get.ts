import type { H3Event } from 'h3'
import { open5eContentTypes } from '~~/constants/dnd'

const DEFAULT_DOCUMENTS = 'srd-2024'
const DEFAULT_ORDERING = 'name'

interface WarmTarget {
  name: string
  path: string
  query?: Record<string, string | number>
}

const targets: WarmTarget[] = [
  { name: 'documents', path: '/api/open5e/documents' },
  { name: 'conditions', path: '/api/open5e/conditions' },
  ...open5eContentTypes.map(type => ({
    name: `listing:${type}`,
    path: '/api/open5e/listing',
    query: {
      type,
      page: 0,
      search: '',
      documents: DEFAULT_DOCUMENTS,
      ordering: DEFAULT_ORDERING,
    },
  })),
]

function assertCronRequest(event: H3Event): void {
  const { cronSecret } = useRuntimeConfig()

  if (!cronSecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'CRON_SECRET is not configured',
    })
  }

  if (getRequestHeader(event, 'authorization') !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

export default defineEventHandler(async event => {
  assertCronRequest(event)

  setHeader(event, 'Cache-Control', 'no-store')

  const settled = await Promise.allSettled(
    targets.map(target => $fetch(target.path, { query: target.query })),
  )

  const results = settled.map((result, index) => ({
    target: targets[index]!.name,
    ok: result.status === 'fulfilled',
    ...(result.status === 'rejected'
      ? { error: getErrorMessage(result.reason) }
      : {}),
  }))

  const failed = results.filter(result => !result.ok)

  if (failed.length) {
    console.error(
      'Open5e warm-up could not reach every target:',
      failed.map(result => `${result.target} (${result.error})`).join(', '),
    )
  }

  return {
    warmed: results.length - failed.length,
    failed: failed.length,
    results,
  }
})
