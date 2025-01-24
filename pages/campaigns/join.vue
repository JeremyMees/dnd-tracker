<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'

definePageMeta({ middleware: ['auth', 'valid-token'] })

const { toast } = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const isLoading = ref<boolean>(false)

const { data, status } = await useFetch('/api/campaign/validate-join', {
  method: 'POST',
  headers: useRequestHeaders(['cookie']),
  body: { token: route.query.token },
  onResponseError() {
    navigateTo(localePath('/no-access'))
  },
})

async function answerInvite(accept: boolean): Promise<void> {
  isLoading.value = true

  try {
    await $fetch(`/api/campaign/${accept ? 'accept' : 'decline'}-invite`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie']),
      body: { token: route.query.token },
    })

    const url = accept ? campaignUrl(data.value!.campaign, 'encounters') : '/'

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
    <template
      v-if="status === 'success' && data?.campaign"
      #header
    >
      <h2>
        {{ $t('pages.campaign.join.title', { campaign: data.campaign.title }) }}
      </h2>
    </template>

    <template v-if="status === 'success' && data?.campaign">
      <I18nT
        keypath="pages.campaign.join.text"
        tag="p"
        class="text-muted-foreground"
      >
        <template #campaign>
          <span class="text-foreground font-bold">
            {{ data.campaign.title }}
          </span>
        </template>
        <template #role>
          <span class="font-bold">
            {{ $t(`general.roles.${data.role}.title`) }}
          </span>
        </template>
      </I18nT>
    </template>
    <template v-else-if="status === 'pending'">
      <div class="w-full h-10 rounded-lg bg-foreground animate-pulse" />
      <div class="w-full h-[120px] rounded-lg bg-foreground animate-pulse" />
    </template>

    <template
      v-if="status === 'success' && data?.campaign"
      #footer
    >
      <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
        <button
          :disabled="isLoading"
          class="btn-destructive"
          @click="answerInvite(false)"
        >
          {{ $t('actions.decline') }}
        </button>
        <button
          :disabled="isLoading"
          class="btn-success"
          @click="answerInvite(true)"
        >
          {{ $t('actions.join') }}
        </button>
      </div>
    </template>
  </NuxtLayout>
</template>
