<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

definePageMeta({
  auth: true,
  path: '/campaigns/:id(\\d+)-:title/:page?',
  middleware: ['campaign-member'],
})

const route = useRoute()
const { t } = useI18n()
const queryClient = useQueryClient()
const supabase = useSupabaseClient<Database>()

const status = ref<'pending' | 'success' | 'error'>('pending')
const campaign = ref<CampaignFull>()
const admin = ref<boolean>(false)
const owner = ref<boolean>(false)

try {
  const { data, error } = await queryClient.fetchQuery({
    queryKey: ['useCampaignDetail', route.params.id],
    queryFn: async () => await supabase
      .from('campaigns')
      .select(`
          *, 
          created_by(id, username, avatar, name, email), 
          team(
            id,
            role,
            user(id, username, avatar, name, email)
          ), 
          join_campaign(
            id,
            role,
            user(id, username, avatar, name, email)
          )
        `)
      .eq('id', route.params.id)
      .single(),
  })

  if (error) throw createError(error)
  else if (data) {
    campaign.value = data
    admin.value = await allows(isCampaignAdmin, data)
    owner.value = await allows(isCampaignOwner, data)
    status.value = 'success'
  }
}
catch {
  status.value = 'error'
}

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
    ...(admin.value
      ? [{
          link: `${url}/settings`,
          label: t('general.setting', 2),
          icon: 'tabler:settings',
        }]
      : []),
    ...(owner.value
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
            v-if="status === 'success' && campaign?.title"
            class="text-foreground"
          >
            {{ campaign.title }}
          </span>
          <UiSkeleton
            v-else
            class="w-[150px] h-6 rounded-full"
          />
        </h2>
      </div>
    </template>
    <div class="flex flex-wrap gap-4 lg:border-b-2 lg:border-secondary mb-10">
      <TabItem
        v-for="tab in tabs"
        :key="tab.link"
        :link="tab.link"
        :label="tab.label"
        :icon="tab.icon"
        :disabled="status !== 'success'"
      />
    </div>
    <div class="min-h-[40vh]">
      <NuxtPage
        v-if="status === 'success'"
        :current="campaign"
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
    </div>
  </NuxtLayout>
</template>
