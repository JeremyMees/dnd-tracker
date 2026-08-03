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
    <Text> Hi adventurer, </Text>
    <Text>
      <strong>{{ sharedBy }}</strong>
      has shared a note with you from the
      <strong>{{ campaign }}</strong>
      campaign, titled "<strong>{{ noteTitle }}</strong
      >".
    </Text>
    <Hr class="border-t-secondary" />
    <!-- v-dompurify-html is unavailable here: this component is rendered by
         @vue-email/render in its own Vue app, so the Nuxt plugin that registers
         the directive never runs, and DOMPurify needs a DOM Nitro doesn't have.
         noteContent is sanitized server-side in server/api/emails/share-note.post.ts. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="pt-[26px]" v-html="noteContent" />
  </DefaultEmail>
</template>
