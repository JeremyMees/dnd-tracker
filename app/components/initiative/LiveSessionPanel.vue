<script setup lang="ts">
import { useToast } from '~/components/ui/toast'

const props = defineProps<{
  encounterId: number
  rows?: { id: string; name: string }[]
}>()

const { t, locale } = useI18n()
const { toast } = useToast()
const clipboard = useClipboard()
const { ask } = useConfirm()
const user = useAuthenticatedUser()
const { session, active, loading, start, stop } = useLiveSession(
  props.encounterId,
)

const pro = computed<boolean>(() => isPro(user.value))
const link = computed<string>(() =>
  session.value ? liveSessionUrl(session.value.code, locale.value) : '',
)

const now = ref<number>(Date.now())
let interval: ReturnType<typeof setInterval> | undefined

const remaining = computed<string>(() =>
  session.value ? timeRemaining(session.value.expiresAt, now.value) : '',
)

onMounted(() => {
  if (pro.value) start()

  interval = setInterval(() => {
    now.value = Date.now()
  }, 30000)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})

function copyLink(): void {
  if (!link.value) return

  clipboard.copy(link.value)

  toast({
    description: t('actions.copyClipboard'),
    variant: 'info',
  })
}

function endSession(): void {
  ask(
    {
      title: t('components.liveSession.endConfirm.title'),
      description: t('components.liveSession.endConfirm.text'),
    },
    async confirmed => {
      if (confirmed) await stop()
    },
  )
}
</script>

<template>
  <div
    test-id="live-session-panel"
    class="flex flex-col text-center gap-4 min-w-64"
  >
    <p class="head-2">
      {{ $t('components.liveSession.title') }}
    </p>

    <div v-if="!pro" test-id="upsell" class="flex flex-col gap-3">
      <p class="text-sm text-muted-foreground">
        {{ $t('components.liveSession.upsell') }}
      </p>
      <UiButton as-child>
        <NuxtLinkLocale to="/pricing">
          {{ $t('components.navbar.upgrade') }}
        </NuxtLinkLocale>
      </UiButton>
    </div>

    <div
      v-else-if="loading && !session"
      test-id="loading"
      class="flex flex-col items-center gap-2"
    >
      <UiSkeleton class="size-32" />
      <UiSkeleton class="h-4 w-full" />
    </div>

    <div v-else-if="!active" test-id="start" class="flex flex-col gap-2">
      <UiButton :disabled="loading" @click="start">
        {{ $t('components.liveSession.start') }}
      </UiButton>
    </div>

    <div v-else test-id="active" class="flex flex-col gap-3 items-center">
      <QrCode :value="link" />

      <div class="flex flex-col items-center gap-1">
        <span class="text-xs text-muted-foreground">
          {{ $t('components.liveSession.code') }}
        </span>
        <span test-id="code" class="text-2xl font-bold tracking-widest">
          {{ session?.code }}
        </span>
      </div>

      <UiButton test-id="copy-link" size="sm" class="w-full" @click="copyLink">
        <Icon name="tabler:link" aria-hidden="true" />
        {{ $t('components.liveSession.copyLink') }}
      </UiButton>

      <p
        v-if="remaining"
        test-id="expires"
        class="text-xs text-muted-foreground"
      >
        {{ $t('components.liveSession.expiresIn', { time: remaining }) }}
      </p>

      <UiSeparator />

      <InitiativeLiveSeatList
        :encounter-id="encounterId"
        :session="session"
        :rows="rows ?? []"
      />

      <UiButton
        test-id="end"
        variant="destructive-ghost"
        size="sm"
        class="w-full"
        :disabled="loading"
        @click="endSession"
      >
        {{ $t('components.liveSession.end') }}
      </UiButton>
    </div>
  </div>
</template>
