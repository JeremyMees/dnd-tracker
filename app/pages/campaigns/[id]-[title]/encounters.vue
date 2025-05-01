<script lang="ts" setup>
import Encounters from '~/components/templates/Encounters.vue'

useSeo('Campaign encounters')

defineProps<{
  current?: CampaignFull
  campaignId: number
  isAdmin: boolean
  isOwner: boolean
  fetchReady: boolean
}>()
</script>

<template>
  <Encounters
    :campaign-id="campaignId"
    :fetch-ready="fetchReady"
  />
</template>
