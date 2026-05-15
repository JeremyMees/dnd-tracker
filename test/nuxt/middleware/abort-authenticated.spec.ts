import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockFrom, mockTo } from '~~/test/nuxt/fixtures/middleware'
import middleware from '~/middleware/abort-authenticated'

const userValue = ref<Partial<ProfileRow> | null>({ id: '1' })

mockNuxtImport('useSupabaseUser', () => vi.fn(() => userValue))
mockNuxtImport('navigateTo', () => vi.fn())

describe('Abort authenticated middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to home page when user is authenticated', () => {
    userValue.value = { id: '1' }

    middleware(mockTo, mockFrom)

    expect(navigateTo).toHaveBeenCalledWith('/')
  })

  it('should not redirect when user is not authenticated', () => {
    userValue.value = null

    middleware(mockTo, mockFrom)

    expect(navigateTo).not.toHaveBeenCalled()
  })
})
