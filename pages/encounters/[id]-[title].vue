<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title',
  middleware: ['encounter-access'],
})

const route = useRoute()
useSeo(route.params.title as string)

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

const { data, status } = useInitiativeSheetDetail(EncounterId.value)
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
          queryClient.invalidateQueries({ queryKey: ['useInitiativeSheetDetail', EncounterId.value] })
        }
      },
    ).subscribe()
  }
})

onBeforeUnmount(() => {
  if (channel) {
    channel.unsubscribe()
    supabase.removeChannel(channel)
  }
})

async function handleUpdate(payload: Omit<Partial<InitiativeSheet>, NotUpdatable | 'campaign'>): Promise<void> {
  if (!data.value) return

  await update({
    data: payload,
    id: EncounterId.value,
    onSettled: async () => {
      if (!realtimeData.value) {
        await queryClient.invalidateQueries({ queryKey: ['useInitiativeSheetDetail', EncounterId.value] })
      }
    },
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
          <ClientOnly>
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
            <template #fallback>
              <UiSkeleton class="w-[150px] h-6 rounded-full" />
            </template>
          </ClientOnly>
        </h2>
      </div>
    </template>

    <InitiativeTable
      v-if="status !== 'error'"
      :data="data"
      :update="handleUpdate"
      :loading="status === 'pending'"
    />
    <Card
      v-else-if="status === 'error'"
      color="danger"
      class="h-[40vh] flex flex-col items-center justify-center gap-2"
    >
      <Icon
        name="tabler:alert-triangle"
        class="size-10"
      />
      <p class="head-3">
        {{ $t('general.error.text') }}
      </p>
    </Card>

    <template #sidebar-content="{ isExpanded, toggleSidebar }">
      <EncounterSidebar
        :is-expanded="isExpanded"
        @toggle-sidebar="toggleSidebar"
        @tweak-settings="tweakSettings"
      />
    </template>
  </NuxtLayout>
</template>
