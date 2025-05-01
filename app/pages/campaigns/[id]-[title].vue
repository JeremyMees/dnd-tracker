<script setup lang="ts">
import { useCampaignDetail } from '~~/queries/campaigns'

definePageMeta({
  auth: true,
  path: '/campaigns/:id(\\d+)-:title/:page?',
  middleware: ['campaign-member'],
})

const route = useRoute()
const { t } = useI18n()

const { data, isPending, isError, isSuccess } = useCampaignDetail(+route.params.id)

const fetchReady = ref(false)
onNuxtReady(() => fetchReady.value = true)

const isAdmin = computedAsync(async () => data.value ? await allows(isCampaignAdmin, data.value) : false, false)
const isOwner = computedAsync(async () => data.value ? await allows(isCampaignOwner, data.value) : false, false)

const tabs = computed<Tab[]>(() => {
  const url = route.fullPath.split('/').slice(0, -1).join('/')

  return [
    {
      link: `${url}/encounters`,
      label: t('general.encounter', 2),
      icon: 'tabler:list-details',
    },
    {
      link: `${url}/homebrews`,
      label: t('general.homebrew', 2),
      icon: 'tabler:beer',
    },
    {
      link: `${url}/notes`,
      label: t('general.note', 2),
      icon: 'tabler:notes',
    },
    ...(isAdmin.value
      ? [{
          link: `${url}/settings`,
          label: t('general.setting', 2),
          icon: 'tabler:settings',
        }]
      : []),
    ...(isOwner.value
      ? [{
          link: `${url}/danger-zone`,
          label: t('general.dangerZone'),
          icon: 'tabler:alert-triangle',
        }]
      : []),
  ]
})
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #header>
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <NuxtLinkLocale
          v-tippy="$t('actions.back')"
          to="/campaigns"
          class="icon-btn-ghost"
        >
          <Icon
            name="tabler:arrow-left"
            class="w-4 h-4"
            :aria-hidden="true"
          />
        </NuxtLinkLocale>
        <h2 class="text-muted-foreground flex gap-2">
          <span class="hidden md:block">
            {{ $t('general.campaign') }}:
          </span>
          <ClientOnly>
            <span
              v-if="isSuccess && data?.title"
              class="text-foreground"
            >
              {{ data.title }}
            </span>
            <UiSkeletonBase
              v-else
              class="w-[150px] h-9 rounded-full"
            />
            <template #fallback>
              <UiSkeletonBase class="w-[150px] h-9 rounded-full" />
            </template>
          </ClientOnly>
        </h2>
      </div>
    </template>
    <div class="flex flex-wrap gap-4 lg:border-b-2 lg:border-secondary mb-10">
      <ClientOnly>
        <TabItem
          v-for="tab in tabs"
          :key="tab.link"
          :link="tab.link"
          :label="tab.label"
          :icon="tab.icon"
          :disabled="isError || isPending"
        />
        <template #fallback>
          <UiSkeletonBase
            v-for="i in 5"
            :key="i"
            class="w-[125px] h-9 lg:h-6 rounded-lg"
          />
        </template>
      </ClientOnly>
    </div>
    <div class="min-h-[40vh]">
      <NuxtPage
        v-if="!isError"
        :current="data"
        :is-admin="isAdmin"
        :is-owner="isOwner"
        :fetch-ready="fetchReady"
        :campaign-id="+route.params.id"
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
    </div>
  </NuxtLayout>
</template>
