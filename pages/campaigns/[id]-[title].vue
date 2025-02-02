<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

definePageMeta({ middleware: ['auth', 'id-param', 'campaign-member'] })

const profile = useProfile()
const route = useRoute()
const queryClient = useQueryClient()

const url = computed<string>(() => route.fullPath.split('/').slice(0, -1).join('/'))

const { data, status } = useCampaignDetail(+route.params.id)
</script>

<template>
  <NuxtLayout name="sidebar">
    <template #header>
      <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
        <NuxtLinkLocale
          v-tippy="$t('actions.back')"
          to="/campaigns"
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
    <div class="flex flex-wrap gap-4 lg:border-b-2 lg:border-secondary mb-10">
      <TabItem
        :link="`${url}/encounters`"
        :label="$t('general.encounter', 2)"
        icon="tabler:list-details"
        :disabled="status !== 'success'"
      />
      <TabItem
        :link="`${url}/homebrews`"
        :label="$t('general.homebrew', 2)"
        icon="tabler:beer"
        :disabled="status !== 'success'"
      />
      <TabItem
        :link="`${url}/notes`"
        :label="$t('general.note', 2)"
        icon="tabler:notes"
        :disabled="status !== 'success'"
      />
      <TabItem
        :link="`${url}/settings`"
        :label="$t('general.setting', 2)"
        icon="tabler:settings"
        :disabled="status !== 'success' || !data || !isAdmin(data, profile.user!.id)"
      />
      <TabItem
        :link="`${url}/danger-zone`"
        :label="$t('general.dangerZone')"
        icon="tabler:alert-triangle"
        :disabled="status !== 'success' || !data || !isOwner(data, profile.user!.id)"
      />
    </div>
    <div class="min-h-[40vh]">
      <NuxtPage
        :current="data"
        @refresh="queryClient.invalidateQueries({ queryKey: ['useCampaignDetail'] })"
      />
    </div>
  </NuxtLayout>
</template>
