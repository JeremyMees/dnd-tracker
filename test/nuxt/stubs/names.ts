import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { getQuery } from 'h3'

export interface NameRequest {
  amount?: string
  race?: string
  gender?: string
}

export const nameRequests: NameRequest[] = []

let gate: Promise<void> | undefined

export function stubNamesEndpoint(): void {
  registerEndpoint('/api/names', async event => {
    const query = getQuery(event) as NameRequest
    const held = gate

    gate = undefined
    nameRequests.push(query)

    if (held) await held

    return Array.from(
      { length: Number(query.amount ?? 1) },
      (_, index) => `Test Name ${nameRequests.length}-${index + 1}`,
    )
  })
}

export function resetNames(): void {
  nameRequests.length = 0
  gate = undefined
}

export function holdNextNames(): () => void {
  let release: () => void = () => {}

  gate = new Promise<void>(resolve => (release = resolve))

  return release
}

export async function flushNames(): Promise<void> {
  await flushPromises()
  await nextTick()
}
