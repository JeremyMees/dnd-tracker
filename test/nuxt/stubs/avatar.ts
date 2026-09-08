import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { getQuery } from 'h3'

const GENERATE_DEBOUNCE = 150

export const avatarRequests: SelectedStyleOptions[] = []

let gate: Promise<void> | undefined

export function stubAvatarEndpoint(): void {
  registerEndpoint('/api/avatar', async event => {
    const query = getQuery(event) as SelectedStyleOptions
    const held = gate

    gate = undefined
    avatarRequests.push(query)

    if (held) await held

    return {
      url: `data:image/svg+xml,${new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)]),
      ).toString()}`,
      extra: query,
    }
  })
}

export function holdNextAvatar(): () => void {
  let release: () => void = () => {}

  gate = new Promise<void>(resolve => (release = resolve))

  return release
}

export async function flushAvatar(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, GENERATE_DEBOUNCE + 50))
  await flushPromises()
}
