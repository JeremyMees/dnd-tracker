import type { RealtimeChannel } from '@supabase/supabase-js'
import { createSharedComposable } from '@vueuse/core'
import { useToast } from '~/components/ui/toast'

interface LiveSeatsSession {
  uuid: string
  seats: LiveSeat[]
}

const liveSeatErrors = new Set([
  'no-active-session',
  'seat-not-found',
  'row-not-found',
  'row-claimed',
])

function _useLiveSeats(
  encounterId: number,
  session: Ref<LiveSeatsSession | undefined>,
) {
  const { toast } = useToast()
  const { t } = useI18n()
  const supabase = useSupabaseClient<DB>()

  const seats = ref<LiveSeat[]>([])
  const connected = ref<Set<string>>(new Set())

  let channel: RealtimeChannel | undefined

  function applyUpdate(payload: LiveSeatsBroadcast): void {
    if (payload.type === 'joined') {
      seats.value = [...seats.value, payload.seat]
    } else if (payload.type === 'kicked') {
      seats.value = seats.value.filter(seat => seat.seat !== payload.seat)
    } else {
      seats.value = seats.value.map(seat =>
        seat.seat === payload.seat ? { ...seat, row: payload.row } : seat,
      )
    }
  }

  function subscribe(uuid: string): void {
    channel = supabase.channel(`live:${uuid}`)

    channel
      .on('broadcast', { event: 'seats' }, ({ payload }) =>
        applyUpdate(payload as LiveSeatsBroadcast),
      )
      .on('presence', { event: 'sync' }, () => {
        connected.value = new Set(
          Object.values(channel!.presenceState())
            .flat()
            .map(presence => (presence as unknown as { seat: string }).seat),
        )
      })
      .subscribe()
  }

  function unsubscribe(): void {
    if (!channel) return

    channel.unsubscribe()
    supabase.removeChannel(channel)
    channel = undefined
    connected.value = new Set()
  }

  watch(
    () => session.value?.seats,
    value => {
      seats.value = value ?? []
    },
    { immediate: true },
  )

  watch(
    () => session.value?.uuid,
    uuid => {
      unsubscribe()
      if (uuid) subscribe(uuid)
    },
    { immediate: true },
  )

  onScopeDispose(unsubscribe)

  function errorDescription(error: unknown): string {
    const slug = getErrorMessage(error)

    if (!slug || !liveSeatErrors.has(slug)) {
      return t('general.error.text')
    }

    return t(`pages.encounter.liveSession.errors.${kebabToCamel(slug)}`)
  }

  async function kick(seat: string): Promise<void> {
    try {
      await $fetch('/api/encounter/live/kick', {
        method: 'POST',
        body: { encounter: encounterId, seat },
      })

      seats.value = seats.value.filter(s => s.seat !== seat)
    } catch (error) {
      toast({
        title: t('general.error.title'),
        description: errorDescription(error),
        variant: 'destructive',
      })
    }
  }

  async function reassign(seat: string, row: string): Promise<void> {
    try {
      await $fetch('/api/encounter/live/reassign', {
        method: 'POST',
        body: { encounter: encounterId, seat, row },
      })

      seats.value = seats.value.map(s => (s.seat === seat ? { ...s, row } : s))
    } catch (error) {
      toast({
        title: t('general.error.title'),
        description: errorDescription(error),
        variant: 'destructive',
      })
    }
  }

  return {
    seats,
    connected,
    kick,
    reassign,
  }
}

export const useLiveSeats = createSharedComposable(_useLiveSeats)
