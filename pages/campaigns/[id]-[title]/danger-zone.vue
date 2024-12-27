<script lang="ts" setup>
const props = defineProps<{ current: CampaignFull }>()

const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const campaign = useCampaigns()
const profile = useProfile()
const modal = useModal()
const { ask } = useConfirm()
const { t } = useI18n()

async function deleteCampaign(): Promise<void> {
  ask({
    title: `${props.current.title}`,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      await campaign.deleteCampaign(props.current.id)
      navigateTo(localePath('/campaigns'))
    }
    catch (err) {
      toast.error()
    }
  })
}

async function transferOwnership(): Promise<void> {
  modal.open({
    component: 'TransferOwnership',
    header: t('components.transferOwnershipModal.title', { campaign: props.current.title }),
    props: { current: props.current },
    events: {
      finished: () => navigateTo(route.fullPath.replace('danger-zone', 'encounters')),
    },
  })
}
</script>

<template>
  <section class="flex flex-col items-center w-full gap-y-4 py-6">
    <div class="grow max-w-4xl border-4 border-danger bg-danger/50 rounded-lg">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-x-8 gap-y-4 p-6">
        <div class="space-y-2">
          <h3>
            {{ $t('pages.campaign.danger.transfer.title') }}
          </h3>
          <p>
            {{ $t('pages.campaign.danger.transfer.text') }}
          </p>
        </div>
        <div class="flex justify-end">
          <button
            :aria-label="$t('actions.transfer')"
            :disabled="!current.team?.length || !current || !isOwner(current, profile.user!.id)"
            class="btn-black"
            @click="transferOwnership"
          >
            {{ $t('actions.transfer') }}
          </button>
        </div>
      </div>
      <div class="w-full border-2 border-danger" />
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-x-8 gap-y-4 p-6">
        <div class="space-y-2">
          <h3>
            {{ $t('pages.campaign.danger.delete.title') }}
          </h3>
          <p>
            {{ $t('pages.campaign.danger.delete.text') }}
          </p>
        </div>
        <div class="flex justify-end">
          <button
            :aria-label="$t('actions.delete')"
            :disabled="!current || !isOwner(current, profile.user!.id)"
            class="btn-black"
            @click="deleteCampaign"
          >
            {{ $t('actions.delete') }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
