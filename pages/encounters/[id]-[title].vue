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
            v-if="status === 'success'"
            class="text-foreground"
          >
            {{ data?.title }}
          </span>
          <UiSkeleton
            v-else
            class="w-[150px] h-8 rounded-full"
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

    <template #sidebar-content="{ isExpanded }">
      <UiSidebarGroup>
        <UiSidebarGroupLabel class="font-bold">
          {{ $t('pages.encounter.options') }}
        </UiSidebarGroupLabel>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: `DnD ${$t('general.content')}`,
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="`DnD ${$t('general.content')}`"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:search"
                  class="size-4 min-w-4 text-success"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  DnD {{ $t('general.content') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('actions.roll'),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('actions.roll')"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:hexagon"
                  class="size-4 min-w-4 text-tertiary"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  {{ $t('actions.roll') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                :aria-label="$t('general.bestiary')"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:bat"
                  class="size-4 min-w-4 text-destructive"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  {{ $t('general.bestiary') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                :aria-label="$t('general.campaignHomebrew')"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:meeple"
                  class="size-4 min-w-4 text-primary"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  {{ $t('general.campaignHomebrew') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('general.newHomebrew'),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('general.newHomebrew')"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:beer"
                  class="size-4 min-w-4 text-warning"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  {{ $t('general.newHomebrew') }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
          <UiSidebarMenuItem>
            <UiSidebarMenuButton as-child>
              <button
                v-tippy="{
                  content: $t('general.setting', 2),
                  placement: 'right',
                  onShow: () => !isExpanded,
                }"
                :aria-label="$t('general.setting', 2)"
                @click="tweakSettings"
              >
                <Icon
                  name="tabler:settings"
                  class="size-4 min-w-4"
                />
                <span class="group-data-[collapsible=icon]:hidden truncate">
                  {{ $t('general.setting', 2) }}
                </span>
              </button>
            </UiSidebarMenuButton>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarGroup>
      <UiSeparator />
    </template>
  </NuxtLayout>
</template>
