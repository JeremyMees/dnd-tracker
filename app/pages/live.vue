<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

definePageMeta({ middleware: ['live-access'] })

useSeo('Live')

const route = useRoute()
const queryClient = useQueryClient()

const validated = ref<{ code: string; expiresAt: string }>()
const initialErrorStatus = ref<number>()

const initialCode = computed<string | undefined>(() =>
  typeof route.query.code === 'string' ? route.query.code : undefined,
)

onMounted(() => {
  if (!initialCode.value) return

  const session = queryClient.getQueryData<{
    code: string
    expiresAt: string
  }>(['useLiveCode', initialCode.value])

  if (session) validated.value = session
  else {
    initialErrorStatus.value =
      queryClient.getQueryData<number>([
        'useLiveCodeError',
        initialCode.value,
      ]) ?? 500
  }
})

function handleValidated(session: { code: string; expiresAt: string }): void {
  validated.value = session
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1 test-id="title" class="text-center head-3">
        {{ $t('pages.live.title') }}
      </h1>
    </template>

    <template v-if="!validated">
      <p class="text-sm text-muted-foreground text-center mb-4">
        {{ $t('pages.live.text') }}
      </p>
      <FormLiveJoinCode
        :initial-code="initialCode"
        :initial-error-status="initialErrorStatus"
        @validated="handleValidated"
      />
    </template>

    <div v-else test-id="confirmed" class="flex flex-col items-center gap-2">
      <p class="text-sm text-muted-foreground">
        {{ $t('pages.live.confirmed') }}
      </p>
      <span class="text-2xl font-bold tracking-widest">
        {{ validated.code }}
      </span>
    </div>
  </NuxtLayout>
</template>
