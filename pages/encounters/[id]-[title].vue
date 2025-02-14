<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title',
})

const route = useRoute()
const localePath = useLocalePath()
const user = useAuthenticatedUser()
const queryClient = useQueryClient()

const { toast } = useToast()
const modal = useModal()
const { t } = useI18n()

const supabase = useSupabaseClient<Database>()
const channel = supabase.channel('initiative_sheets')

const EncounterId = computed(() => +route.params.id)
const realtimeData = computed(() => hasCorrectSubscription(user.value.subscription_type, 'medior'))

const { data } = useInitiativeSheetDetail(EncounterId.value)
const { mutateAsync: update } = useInitiativeSheetDetailUpdate()

onMounted(() => {
  if (realtimeData.value) {
    channel.on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'initiative_sheets',
        filter: `id=eq.${EncounterId.value}`,
      },
      async (payload) => {
        if (payload.eventType === 'DELETE') {
          toast({
            title: t('pages.encounter.toasts.removed.title'),
            description: t('pages.encounter.toasts.removed.text'),
            variant: 'warning',
          })

          navigateTo(localePath('/encounters'))
        }
        else if (payload.new && Object.keys(payload.new).length > 0) {
          await queryClient.invalidateQueries({ queryKey: ['useInitiativeSheetDetail', EncounterId.value] })
        }
      },
    )
      .subscribe()
  }
})

onBeforeUnmount(() => {
  if (channel) {
    channel.unsubscribe()
    supabase.removeChannel(channel)
  }
})

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable>): Promise<void> {
  if (!data.value) return

  await update({
    data: {
      ...payload,
      ...(
        typeof payload.campaign === 'number'
          ? { campaign: payload.campaign }
          : payload.campaign && 'id' in payload.campaign
            ? { campaign: payload.campaign.id }
            : { campaign: undefined }
      ),
    },
    id: EncounterId.value,
  })
}

function tweakSettings(): void {
  if (!data.value) return

  modal.open({
    component: 'InitiativeSettings',
    header: t('general.setting', 2),
    submit: t('actions.save'),
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
      :data="(data as unknown as InitiativeSheet)"
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
