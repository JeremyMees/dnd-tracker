<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'
import { useInitiativeSheetDetail, useInitiativeSheetDetailUpdate } from '~~/queries/initiative-sheets'

definePageMeta({
  auth: true,
  path: '/encounters/:id(\\d+)-:title',
  middleware: ['encounter-access'],
})

const route = useRoute()
useSeo(route.params.title as string)

const localePath = useLocalePath()
const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()
const { startTour } = useTour()

const supabase = useSupabaseClient<DB>()
const channel = supabase.channel('initiative_sheets')

const id = validateParamId(route.params.id)
const realtimeData = computed(() => hasCorrectSubscription(user.value.subscription_type, 'medior'))

const { data, isPending, isError, refetch } = useInitiativeSheetDetail(id)
const { mutateAsync: update } = useInitiativeSheetDetailUpdate()

const activeRow = ref<InitiativeSheetRow>()

onMounted(() => {
  if (realtimeData.value) {
    channel.on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'initiative_sheets',
        filter: `id=eq.${id}`,
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
          await refetch()
        }
      },
    ).subscribe()
  }

  startTour(!!data.value?.campaign)
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
    id,
    onSettled: async () => {
      if (!realtimeData.value) {
        await refetch()
      }
    },
  })
}

provide(INITIATIVE_SHEET, {
  sheet: data,
  update: handleUpdate,
  activeRow,
})
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #header>
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <NuxtLinkLocale
          v-if="!data?.campaign"
          v-tippy="$t('actions.back')"
          to="/encounters"
          class="icon-btn-ghost"
        >
          <Icon
            name="tabler:arrow-left"
            class="size-4 min-w-4"
            :aria-hidden="true"
          />
        </NuxtLinkLocale>
        <UiDropdownMenu v-else>
          <UiDropdownMenuTrigger as-child>
            <button
              :aria-label="$t('actions.back')"
              class="icon-btn-ghost"
            >
              <Icon
                name="tabler:arrow-left"
                class="size-4 min-w-4"
                :aria-hidden="true"
              />
            </button>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="start">
            <UiDropdownMenuItem>
              <NuxtLinkLocale
                :to="campaignUrl(data.campaign, 'encounters')"
                class="flex items-center gap-2"
              >
                <Icon
                  name="tabler:layout-dashboard"
                  class="size-4 min-w-4"
                />
                {{ $t('pages.encounter.back.campaigns', { campaign: data.campaign?.title }) }}
              </NuxtLinkLocale>
            </UiDropdownMenuItem>
            <UiDropdownMenuItem>
              <NuxtLinkLocale
                to="/encounters"
                class="flex items-center gap-2"
              >
                <Icon
                  name="tabler:list-details"
                  class="size-4 min-w-4"
                />
                {{ $t('pages.encounter.back.encounters') }}
              </NuxtLinkLocale>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
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
              class="w-[150px] h-9 rounded-full"
            />
            <template #fallback>
              <UiSkeleton class="w-[150px] h-9 rounded-full" />
            </template>
          </ClientOnly>
        </h2>
      </div>
    </template>

    <InitiativeTable
      v-if="!isError"
      :loading="isPending"
    />
    <Card
      v-else
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
      />
    </template>
  </NuxtLayout>
</template>
