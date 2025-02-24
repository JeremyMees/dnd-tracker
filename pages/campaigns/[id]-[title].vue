<script setup lang="ts">
definePageMeta({
  auth: true,
  path: '/campaigns/:id(\\d+)-:title/:page?',
  middleware: ['campaign-member'],
})

const route = useRoute()

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
          <ClientOnly>
            <span
              v-if="status === 'success' && data?.title"
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
    <ClientOnly>
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
        <Can
          v-if="data"
          :ability="isCampaignAdmin"
          :args="[data]"
        >
          <TabItem
            :link="`${url}/settings`"
            :label="$t('general.setting', 2)"
            icon="tabler:settings"
            :disabled="status !== 'success'"
          />
        </Can>
        <Can
          v-if="data"
          :ability="isCampaignOwner"
          :args="[data]"
        >
          <TabItem
            :link="`${url}/danger-zone`"
            :label="$t('general.dangerZone')"
            icon="tabler:alert-triangle"
            :disabled="status !== 'success'"
          />
        </Can>
      </div>
    </ClientOnly>
    <div class="min-h-[40vh]">
      <NuxtPage
        v-if="data"
        :current="data"
      />
      <UiSkeleton
        v-else
        class="h-[40vh]"
      />
    </div>
  </NuxtLayout>
</template>
