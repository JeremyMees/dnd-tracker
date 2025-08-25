<script setup lang="ts">
import { Text, Hr } from '@vue-email/components'
import DefaultEmail from './Layout/Default.vue'

defineProps<{
  email: string
  noteContent: string
  noteTitle: string
  campaign: string
  sharedBy: string
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    :title="`New Note Shared from ${campaign}!`"
    heading="Shared campaign note"
    preview="Shared campaign note"
  >
    <Text>
      Hi adventurer,
    </Text>
    <Text>
      <strong>{{ sharedBy }}</strong>
      has shared a note with you from the
      <strong>{{ campaign }}</strong>
      campaign, titled
      "<strong>{{ noteTitle }}</strong>".
    </Text>
    <Hr class="border-t-secondary" />
    <div
      v-dompurify-html="noteContent"
      class="pt-[26px]"
    />
  </DefaultEmail>
</template>
