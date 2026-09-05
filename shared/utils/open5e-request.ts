import { ONE_SECOND } from '~~/constants/time'

const OPEN5E_BASE = 'https://api.open5e.com/v2'

export const OPEN5E_TIMEOUT = ONE_SECOND * 8

const pathMap = new Map<Open5eType, string>([
  ['monsters', 'creatures'],
  ['spells', 'spells'],
  ['conditions', 'conditions'],
  ['magicitems', 'magicitems'],
  ['weapons', 'weapons'],
  ['armor', 'armor'],
  ['documents', 'documents'],
])

export type Open5eQueryParams = Record<
  string,
  string | number | boolean | undefined | null
>

export interface Open5eRequestError extends Error {
  status?: number
}

export function open5eUrl(type: Open5eType, params: Open5eQueryParams): string {
  const path = pathMap.get(type)

  if (!path) throw new Error(`Unsupported open5e type: ${type}`)

  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue

    query.append(key, String(value))
  }

  query.sort()

  const search = query.toString()

  return `${OPEN5E_BASE}/${path}/${search ? `?${search}` : ''}`
}

export async function requestOpen5e<T>(
  type: Open5eType,
  params: Open5eQueryParams,
  timeout: number = OPEN5E_TIMEOUT,
): Promise<Open5eResponse<T>> {
  const response = await fetch(open5eUrl(type, params), {
    signal: AbortSignal.timeout(timeout),
  })

  if (!response.ok) {
    const error: Open5eRequestError = new Error(
      `Open5e responded ${response.status} for ${type}`,
    )

    error.status = response.status

    throw error
  }

  return (await response.json()) as Open5eResponse<T>
}
