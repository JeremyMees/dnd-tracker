import { useToast } from '~/components/ui/toast'

interface LiveSessionResponse {
  token: string
  code: string
  expiresAt: string
}

const liveSessionErrors = new Set(['pro-required', 'no-active-session'])

export function useLiveSession(encounterId: number) {
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

  async function start(): Promise<void> {
    loading.value = true

    try {
      session.value = await $fetch<LiveSessionResponse>('/api/live/start', {
        method: 'POST',
        body: { encounter: encounterId },
      })
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
  }
}
