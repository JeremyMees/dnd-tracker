import { vi } from 'vitest'
import type { LocationQuery } from 'vue-router'
import type { MockInstance } from 'vitest'

export function spyOnReplace(): MockInstance {
  return vi.spyOn(useRouter(), 'replace')
}

export async function goto(query: LocationQuery = {}): Promise<void> {
  await useRouter().replace({ path: '/', query })
}

export async function flushNavigation(replace: MockInstance): Promise<void> {
  await nextTick()
  await Promise.all(replace.mock.results.map(result => result.value))
  await nextTick()
}
