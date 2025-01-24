<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({ middleware: ['auth', 'id-param'] })

const profile = useProfile()
const route = useRoute()
const sheet = useInitiativeSheet()
const { toast } = useToast()
const modal = useModal()
const { t } = useI18n()
const localePath = useLocalePath()

const { data, status, refresh } = await useAsyncData(
  'initiative-sheet',
  async () => await sheet.get(+route.params.id),
)

const realtimeData = computed<boolean>(() => {
  return hasCorrectSubscription(profile.data?.subscription_type || 'free', 'medior')
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
  <NuxtLayout
    name="initiative-sidebar"
    :title="data?.title || $t('general.encounter')"
    :campaign="data?.campaign"
    @open-search="tweakSettings"
    @open-dice-rolling="tweakSettings"
    @open-bestiary="tweakSettings"
    @open-campaign-homebrew="tweakSettings"
    @open-new-homebrew="tweakSettings"
    @open-settings="tweakSettings"
  >
    <InitiativeTable
      v-if="data"
      :encounter="+route.params.id"
      :data="data"
      :update="handleUpdate"
    />
  </NuxtLayout>
</template>
