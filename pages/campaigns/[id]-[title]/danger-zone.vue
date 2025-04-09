<script lang="ts" setup>
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps<{
  current?: CampaignFull
  campaignId: number
}>()

const localePath = useLocalePath()
const route = useRoute()
const { toast } = useToast()
const modal = useModal()
const { ask } = useConfirm()
const { t } = useI18n()

const { mutateAsync: removeCampaign } = useCampaignRemove()

async function remove(): Promise<void> {
  ask({}, async (confirmed: boolean) => {
    if (!confirmed) return

    await removeCampaign({
      id: props.campaignId,
      onSuccess: () => navigateTo(localePath('/campaigns')),
      onError: () => {
        toast({
          title: t('general.error.title'),
          description: t('general.error.text'),
          variant: 'destructive',
        })
      },
    })
  })
}

async function transferOwnership(): Promise<void> {
  if (!props.current) return

  modal.open({
    component: 'TransferOwnership',
    header: t('components.transferOwnershipModal.title', { campaign: props.current.title }),
    submit: t('actions.transfer'),
    props: { current: props.current },
    events: {
      finished: () => navigateTo(route.fullPath.replace('danger-zone', 'encounters')),
    },
  })
}
</script>

<template>
  <section class="flex flex-col items-center w-full gap-y-4 py-6">
    <ClientOnly>
      <div
        v-if="current"
        class="grow max-w-4xl border-4 border-destructive bg-destructive/50 rounded-lg"
      >
        <Bouncer
          :ability="isCampaignOwner"
          :args="[current]"
        >
          <template #can>
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
                  :disabled="!current?.team?.length || !current"
                  class="btn-foreground"
                  @click="transferOwnership"
                >
                  {{ $t('actions.transfer') }}
                </button>
              </div>
            </div>
            <div class="w-full border-2 border-destructive" />
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
                  :disabled="!current"
                  class="btn-foreground"
                  @click="remove"
                >
                  {{ $t('actions.delete') }}
                </button>
              </div>
            </div>
          </template>
          <template #cannot>
            <div class="flex flex-col items-center justify-center h-full">
              <p class="p-6">
                {{ $t('pages.campaign.danger.noPermission') }}
              </p>
            </div>
          </template>
        </Bouncer>
      </div>
      <UiSkeleton
        v-else
        class="w-full h-[220px]"
      />

      <template #fallback>
        <UiSkeleton class="w-full h-[220px]" />
      </template>
    </ClientOnly>
  </section>
</template>
