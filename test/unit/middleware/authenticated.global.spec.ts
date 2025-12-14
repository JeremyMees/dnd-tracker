import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import middleware from '@/middleware/authenticated.global.ts'

const userValue = ref<Partial<ProfileRow> | null>({ id: 1 })

mockNuxtImport('useSupabaseUser', () => vi.fn(() => userValue))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Authenticated middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to login when authentication is needed and user is not authenticated', async () => {
    userValue.value = null
    const to = { meta: { auth: true } }

    await middleware(to)

    expect(navigateTo).toHaveBeenCalledWith('/login')
  })

  it('should not redirect when authentication is not needed', async () => {
    userValue.value = null
    const to = { meta: { auth: false } }

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should not redirect when authentication is not needed and user is authenticated', async () => {
    userValue.value = { id: 1 }
    const to = { meta: { auth: false } }

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('should not redirect when authentication is needed and user is authenticated', async () => {
    userValue.value = { id: 1 }
    const to = { meta: { auth: true } }

    await middleware(to)

    expect(navigateTo).not.toHaveBeenCalled()
  })
})
