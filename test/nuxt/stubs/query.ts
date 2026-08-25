import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useQueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import type { ShallowUnwrapRef } from 'vue'
import { vi } from 'vitest'

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'is',
  'in',
  'contains',
  'match',
  'order',
  'limit',
  'range',
  'single',
  'maybeSingle',
] as const

export type SupabaseChain = Record<
  (typeof CHAIN_METHODS)[number],
  ReturnType<typeof vi.fn>
> & {
  then: PromiseLike<unknown>['then']
}

export function mockChain(result: Record<string, unknown>): SupabaseChain {
  const chain = {} as SupabaseChain

  for (const method of CHAIN_METHODS) {
    chain[method] = vi.fn(() => chain)
  }

  chain.then = (resolve, reject) =>
    Promise.resolve(result).then(resolve, reject)

  return chain
}

const { fetchMock, toast, supabaseFrom, supabaseRpc, supabaseAuthUpdateUser } =
  vi.hoisted(() => ({
    fetchMock: vi.fn(),
    toast: vi.fn(),
    supabaseFrom: vi.fn(),
    supabaseRpc: vi.fn(),
    supabaseAuthUpdateUser: vi.fn().mockResolvedValue({ error: null }),
  }))

export { fetchMock, supabaseAuthUpdateUser, supabaseRpc, toast }

vi.mock('~/components/ui/toast', () => ({ useToast: () => ({ toast }) }))
vi.mock('~/components/ui/toast/use-toast', () => ({
  useToast: () => ({ toast }),
}))

mockNuxtImport('$fetch', () => fetchMock)
mockNuxtImport('useSupabaseClient', () => () => ({
  from: supabaseFrom,
  rpc: supabaseRpc,
  auth: { updateUser: supabaseAuthUpdateUser },
}))

export function mockSupabaseFrom(
  tables: Record<string, SupabaseChain | SupabaseChain[]>,
  options: { rpc?: SupabaseChain | SupabaseChain[] } = {},
) {
  const queues = new Map(
    Object.entries(tables).map(([table, value]) => [
      table,
      Array.isArray(value)
        ? { chains: [...value], repeat: false }
        : { chains: [value], repeat: true },
    ]),
  )

  supabaseFrom.mockImplementation((table: string) => {
    const queue = queues.get(table)

    if (!queue) throw new Error(`No mock configured for table "${table}"`)

    const chain = queue.repeat ? queue.chains[0] : queue.chains.shift()

    if (!chain) {
      throw new Error(
        `Mock for table "${table}" was called more times than configured`,
      )
    }

    return chain
  })

  if (options.rpc) {
    const rpcQueue = Array.isArray(options.rpc) ? [...options.rpc] : null

    supabaseRpc.mockImplementation(() => {
      const chain = rpcQueue ? rpcQueue.shift() : options.rpc

      if (!chain) {
        throw new Error('Mock for rpc() was called more times than configured')
      }

      return chain
    })
  }

  return supabaseFrom
}

export async function mountHook<T extends Record<string, unknown>>(
  setupFn: () => T | Promise<T>,
) {
  const component = await mountSuspended(
    defineComponent({ setup: setupFn, template: '<div />' }),
  )

  await flushPromises()

  return {
    component,
    vm: component.vm as unknown as ShallowUnwrapRef<T>,
  }
}

export async function clearQueryCache() {
  const { vm } = await mountHook(() => ({ queryClient: useQueryClient() }))

  vm.queryClient.clear()
}
