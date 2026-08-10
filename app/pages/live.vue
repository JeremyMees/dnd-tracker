<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useLiveState } from '~/queries/live'

definePageMeta({ middleware: ['live-access'] })

useSeo('Live')

const route = useRoute()
const queryClient = useQueryClient()
const { seat } = useLiveSeat()

const validated = ref<LiveCodeSession>()
const initialErrorStatus = ref<number>()
const joined = ref<LiveJoinResponse>()

const {
  data: state,
  isPending,
  isError,
} = useLiveState(computed(() => joined.value?.sessionToken))

const initialCode = computed<string | undefined>(() =>
  typeof route.query.code === 'string' ? route.query.code : undefined,
)

onMounted(() => {
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
