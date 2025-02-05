<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title/:page?',
})

const user = useAuthenticatedUser()
const route = useRoute()
const sheet = useInitiativeSheet()
const { toast } = useToast()
const modal = useModal()
const { t } = useI18n()
const localePath = useLocalePath()

const { data, refresh } = await useAsyncData(
  'initiative-sheet',
  async () => await sheet.get(+route.params.id),
)

const realtimeData = computed<boolean>(() => {
  return hasCorrectSubscription(user.value.subscription_type, 'medior')
})

onMounted(() => {
  if (realtimeData.value) {
    sheet.subscribeInitiativeSheet(+route.params.id, (payload) => {
      if (payload.eventType === 'DELETE') {
        toast({
          title: t('pages.encounter.toasts.removed.title'),
          description: t('pages.encounter.toasts.removed.text'),
          variant: 'warning',
        })

        navigateTo(localePath('/encounters'))
      }
      else {
        const { campaign, created_at, id, ...updated } = payload.new
        data.value = { ...data.value, ...updated } as InitiativeSheet
      }
    })
  }
})

onBeforeUnmount(() => sheet.unsubscribeInitiativeSheet())

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable>): Promise<void> {
  if (!data.value) return

  if (payload.rows?.length) payload.rows = indexCorrect(payload.rows)

  try {
    await sheet.updateInitiativeSheet({
      ...payload,
      ...(
        typeof payload.campaign === 'number'
          ? { campaign: payload.campaign }
          : payload.campaign && 'id' in payload.campaign
            ? { campaign: payload.campaign.id }
            : { campaign: undefined }
      ),
    }, +route.params.id)

    await refresh()
  }
  catch (err) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}

function tweakSettings(): void {
  if (!data.value) return

  modal.open({
    component: 'InitiativeSettings',
    header: t('general.setting', 2),
    submit: t('actions.save'),
    events: { finished: (settings) => {
      if (data.value) data.value.settings = settings
    } },
    props: {
      encounterId: +route.params.id,
      settings: data.value.settings,
    },
  })
}
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #header>
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <NuxtLinkLocale
          v-tippy="$t('actions.back')"
          to="/encounters"
        >
          <Icon
            name="tabler:arrow-left"
            class="w-4 h-4"
            :aria-hidden="true"
          />
        </NuxtLinkLocale>
        <h2 class="text-muted-foreground flex gap-2">
          <span class="hidden md:block">
            {{ $t('general.encounter') }}:
          </span>
          <span
            v-if="data?.title"
            class="text-foreground"
          >
            {{ data.title }}
          </span>
          <UiSkeleton
            v-else
            class="w-[150px] h-6 rounded-full"
          />
        </h2>
      </div>
    </template>

    <InitiativeTable
      v-if="data"
      :encounter="+route.params.id"
      :data="data"
      :update="handleUpdate"
    />

    <template #sidebar-content="{ isExpanded, toggleSidebar }">
      <EncounterSidebar
        :is-expanded="isExpanded"
        @toggle-sidebar="toggleSidebar"
        @tweak-settings="tweakSettings"
      />
    </template>
  </NuxtLayout>
</template>
