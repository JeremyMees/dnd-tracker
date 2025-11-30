<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'

useSeo('Join campaign')

definePageMeta({
  auth: true,
  middleware: ['valid-token'],
})

const { toast } = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const queryClient = useQueryClient()

interface JoinCampaign {
  campaign: {
    id: number
    title: string
  }
  role: UserRole
  user: string
}

const data = ref<JoinCampaign>()
const isLoading = ref<boolean>(true)

onMounted(() => {
  const cache = queryClient.getQueryData<JoinCampaign>(['useJoinCampaign', route.query.token])

  if (cache) data.value = cache
  else navigateTo(localePath('/no-access'))

  isLoading.value = false
})

async function answerInvite(accept: boolean): Promise<void> {
  if (!data.value) return

  isLoading.value = true

  try {
    await $fetch(`/api/campaign/${accept ? 'accept' : 'decline'}-invite`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: { token: route.query.token },
    })

    const url = accept ? campaignUrl(data.value.campaign, 'encounters') : '/'

    if (accept) {
      toast({
        title: t('pages.campaign.join.toast.accept.title'),
        description: t('pages.campaign.join.toast.accept.text', { campaign: data.value.campaign.title, role: data.value.role }),
        variant: 'success',
      })
    }
    else {
      toast({
        title: t('pages.campaign.join.toast.decline.title'),
        description: t('pages.campaign.join.toast.decline.text', { campaign: data.value.campaign.title }),
        variant: 'destructive',
      })
    }

    queryClient.removeQueries({ queryKey: ['useJoinCampaign', route.query.token] })
    navigateTo(localePath(url))
  }
  catch (err: any) {
    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h2>
        {{ $t('pages.campaign.join.title', { campaign: data?.campaign.title }) }}
      </h2>
    </template>

    <I18nT
      keypath="pages.campaign.join.text"
      tag="p"
      scope="global"
      class="text-muted-foreground"
    >
      <template #campaign>
        <span class="text-foreground font-bold">
          {{ data?.campaign.title || '' }}
        </span>
      </template>
      <template #role>
        <span
          v-if="data?.role"
          class="font-bold"
        >
          {{ $t(`general.roles.${data.role}.title`) }}
        </span>
      </template>
    </I18nT>

    <template #footer>
      <div class="flex flex-col sm:flex-row gap-2">
        <UiButton
          :disabled="isLoading"
          variant="destructive"
          class="w-full"
          @click="answerInvite(false)"
        >
          {{ $t('actions.decline') }}
        </UiButton>
        <UiButton
          :disabled="isLoading"
          variant="foreground"
          class="w-full"
          @click="answerInvite(true)"
        >
          {{ $t('actions.join') }}
        </UiButton>
      </div>
    </template>
  </NuxtLayout>
</template>
