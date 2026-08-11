import { createSharedComposable } from '@vueuse/core'
import { useToast } from '~/components/ui/toast'

export interface LiveSessionResponse {
  token: string
  uuid: string
  code: string
  expiresAt: string
  seats: LiveSeat[]
}

const liveSessionErrors = new Set(['pro-required', 'no-active-session'])

function _useLiveSession(encounterId: number) {
  const { toast } = useToast()
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
      return t('general.error.text')
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
        '/api/live/start',
        {
          method: 'POST',
          body: { encounter: encounterId, createIfMissing },
        },
      )

      if (response) session.value = response
    } catch (error) {
      toast({
        title: t('general.error.title'),
        description: errorDescription(error),
        variant: 'destructive',
      })
    } finally {
      loading.value = false
    }
  }

  function sync(payload: UpdateInitiativeSheetData): void {
    if (!active.value) return

    const relevant = (
      ['round', 'activeIndex', 'rows', 'settings'] as const
    ).some(key => key in payload)

    if (!relevant) return

    $fetch('/api/live/sync', {
      method: 'POST',
      body: { encounter: encounterId },
    }).catch(() => undefined)
  }

  async function stop(): Promise<void> {
    loading.value = true

    try {
      await $fetch('/api/live/stop', {
        method: 'POST',
        body: { encounter: encounterId },
      })

      session.value = undefined
    } catch (error) {
      toast({
        title: t('general.error.title'),
        description: errorDescription(error),
        variant: 'destructive',
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
    sync,
  }
}

export const useLiveSession = createSharedComposable(_useLiveSession)
