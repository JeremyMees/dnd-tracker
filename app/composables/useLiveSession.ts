import { createSharedComposable } from '@vueuse/core'
import { toast } from 'vue-sonner'

const liveSessionErrors = new Set(['pro-required', 'no-active-session'])

function _useLiveSession(encounterId: number) {
  const { t } = useI18n()

  const session = ref<LiveSessionResponse>()
  const loading = ref(false)

  const active = computed(() => {
    if (!session.value) return false

    return new Date(session.value.expiresAt) > new Date()
  })

  function errorDescription(error: unknown): string {
    const slug = getErrorMessage(error)

    if (!slug || !liveSessionErrors.has(slug)) {
      return t(`general.error.reasons.${getFailureReason(error)}`)
    }

    return t(`pages.encounter.liveSession.errors.${kebabToCamel(slug)}`)
  }

  async function start(
    options: { createIfMissing?: boolean } = {},
  ): Promise<void> {
    const createIfMissing = options.createIfMissing ?? true

    loading.value = true

    try {
      const response = await $fetch<LiveSessionResponse | null>(
        '/api/encounter/live/start',
        {
          method: 'POST',
          body: { encounter: encounterId, createIfMissing },
        },
      )

      if (response) session.value = response
    } catch (error) {
      toast.error(t('components.liveSession.failed.start'), {
        description: errorDescription(error),
      })
    } finally {
      loading.value = false
    }
  }

  async function stop(): Promise<void> {
    loading.value = true

    try {
      await $fetch('/api/encounter/live/stop', {
        method: 'POST',
        body: { encounter: encounterId },
      })

      session.value = undefined
    } catch (error) {
      toast.error(t('components.liveSession.failed.end'), {
        description: errorDescription(error),
      })
    } finally {
      loading.value = false
    }
  }

  return {
    session,
    active,
    loading,
    start,
    stop,
  }
}

export const useLiveSession = createSharedComposable(_useLiveSession)
