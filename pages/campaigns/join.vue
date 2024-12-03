<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'valid-token'] })

const toast = useToast()
const localePath = useLocalePath()
const { t } = useI18n()
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

    const url = accept ? campaignUrl(data.value!.campaign, 'content') : '/'

    navigateTo(localePath(url))
  }
  catch (err: any) {
    toast.error()
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <section class="space-y-6">
      <template v-if="status === 'success' && data?.campaign">
        <SplitText
          :text="t('pages.campaign.join.title', { campaign: data.campaign.title })"
          :split="data.campaign.title"
          tag="h2"
          classes="text-primary"
        />
        <p class="text-slate-300">
          {{
            t('pages.campaign.join.text', {
              campaign: data.campaign.title,
              role: t(`general.roles.${data.role}.title`),
            })
          }}
        </p>
        <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button
            :disabled="isLoading"
            class="btn-danger"
            @click="answerInvite(false)"
          >
            {{ t('actions.decline') }}
          </button>
          <button
            :disabled="isLoading"
            class="btn-success"
            @click="answerInvite(true)"
          >
            {{ t('actions.join') }}
          </button>
        </div>
      </template>

      <template v-else-if="status === 'pending'">
        <div class="w-full h-10 rounded-lg bg-bg-light animate-pulse" />
        <div class="w-full h-[120px] rounded-lg bg-bg-light animate-pulse" />
      </template>
    </section>
  </NuxtLayout>
</template>
