<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useLiveState } from '~/queries/live'

definePageMeta({ middleware: ['live-access'] })

useSeo('Live')

const route = useRoute()
const queryClient = useQueryClient()
const { seat, clear } = useLiveSeat()
const { clear: clearSummary } = useLiveSummary()

const validated = ref<LiveCodeSession>()
const initialErrorStatus = ref<number>()
const joined = ref<LiveJoinResponse>()
const ended = ref(false)

const token = computed(() => joined.value?.sessionToken)
const seatToken = computed(() => joined.value?.seatToken)
const uuid = computed(() => joined.value?.uuid)
const seatId = computed(() => joined.value?.seat)
const ownRow = computed(() => joined.value?.row)

const {
  data: state,
  isPending,
  isError,
  error,
} = useLiveState(token, seatToken)

useLiveRealtime(token, uuid, seatToken, seatId, ownRow)

const initialCode = computed<string | undefined>(() =>
  typeof route.query.code === 'string' ? route.query.code : undefined,
)

onMounted(() => {
  const stored = seat.value

  if (stored && (!initialCode.value || stored.code === initialCode.value)) {
    joined.value = stored
    return
  }

  if (!initialCode.value) return

  const session = queryClient.getQueryData<LiveCodeSession>([
    'useLiveCode',
    initialCode.value,
  ])

  if (session) validated.value = session
  else {
    initialErrorStatus.value =
      queryClient.getQueryData<number>([
        'useLiveCodeError',
        initialCode.value,
      ]) ?? 500
  }
})

function showSessionEnded(): void {
  clearSummary()
  clear()
  joined.value = undefined
  validated.value = undefined
  ended.value = true
}

watch(isError, hasError => {
  if (!hasError) return

  const statusCode = (error.value as { statusCode?: number } | null)?.statusCode

  if (statusCode !== 404 && statusCode !== 410) return

  showSessionEnded()
})

watch(
  () => state.value?.session.kicked,
  kicked => {
    if (kicked) showSessionEnded()
  },
)

function handleValidated(session: LiveCodeSession): void {
  validated.value = session
}

function handleJoined(session: LiveJoinResponse): void {
  seat.value = session
  joined.value = session
}
</script>

<template>
  <NuxtLayout :name="joined ? 'simple' : 'centered'">
    <template #header>
      <h1 test-id="title" class="text-center head-3">
        {{ $t('pages.live.title') }}
      </h1>
    </template>

    <template v-if="joined">
      <LivePlayerView
        :sheet="state?.sheet"
        :loading="isPending"
        :error="isError"
      />
    </template>

    <template v-else-if="ended">
      <Card
        test-id="ended"
        class="h-[40vh] flex flex-col items-center justify-center gap-2"
      >
        <Icon name="tabler:alert-triangle" class="size-10" aria-hidden="true" />
        <p class="head-3">{{ $t('pages.live.ended.title') }}</p>
        <p class="text-sm text-muted-foreground text-center">
          {{ $t('pages.live.ended.text') }}
        </p>
        <UiButton test-id="ended-action" class="mt-2" @click="ended = false">
          {{ $t('pages.live.ended.action') }}
        </UiButton>
      </Card>
    </template>

    <template v-else-if="validated">
      <p class="text-sm text-muted-foreground text-center mb-4">
        {{ $t('pages.live.confirmed') }}
      </p>
      <FormLiveJoin
        :code="validated.code"
        :rows="validated.rows"
        @joined="handleJoined"
      />
    </template>

    <template v-else>
      <p class="text-sm text-muted-foreground text-center mb-4">
        {{ $t('pages.live.text') }}
      </p>
      <FormLiveJoinCode
        :initial-code="initialCode"
        :initial-error-status="initialErrorStatus"
        @validated="handleValidated"
      />
    </template>
  </NuxtLayout>
</template>
