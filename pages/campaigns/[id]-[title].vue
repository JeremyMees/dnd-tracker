<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'id-param', 'campaign-member'] })

const profile = useProfile()
const campaign = useCampaigns()
const route = useRoute()
const { t } = useI18n()

const url = computed<string>(() => route.fullPath.split('/').slice(0, -1).join('/'))

const { data, status, refresh } = await useAsyncData(
  'campaign-detail',
  async () => await campaign.getCampaignById(+route.params.id),
)
</script>

<template>
  <NuxtLayout
    container
    shadow
  >
    <div class="pb-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
      <BackButton link="/campaigns" />
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <h1 class="text-slate-300">
          {{ t('general.campaign') }}:
        </h1>
        <span
          v-if="status === 'success'"
          class="head-1"
        >
          {{ data?.title }}
        </span>
        <div
          v-else
          class="w-[150px] h-8 rounded-full bg-bg animate-pulse"
        />
      </div>
    </div>
    <div class="flex flex-wrap gap-4 md:border-b-2 md:border-slate-700 mb-10">
      <TabItem
        :link="`${url}/content`"
        :label="t('general.content')"
        icon="fluent:content-view-24-regular"
        :disabled="status !== 'success'"
      />
      <TabItem
        :link="`${url}/settings`"
        :label="t('general.settings')"
        icon="material-symbols:settings-outline"
        :disabled="status !== 'success' || !isAdmin(data, profile.user!.id)"
      />
      <TabItem
        :link="`${url}/danger-zone`"
        :label="t('general.dangerZone')"
        icon="material-symbols:warning-outline"
        :disabled="status !== 'success' || !isOwner(data, profile.user!.id)"
      />
    </div>
    <div class="min-h-[40vh]">
      <NuxtPage
        :current="data"
        @refresh="refresh"
      />
    </div>
  </NuxtLayout>
</template>
