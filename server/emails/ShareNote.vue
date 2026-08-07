<script setup lang="ts">
import { Text } from '@vue-email/text'
import { Hr } from '@vue-email/hr'
import DefaultEmail from './Layout/Default.vue'
import { colors } from './theme'

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
    <Hr :style="`border-top: 1px solid ${colors.secondary}`" />
    <!-- v-dompurify-html is unavailable here: this component is rendered by
         @vue-email/render in its own Vue app, so the Nuxt plugin that registers
         the directive never runs, and DOMPurify needs a DOM Nitro doesn't have.
         noteContent is sanitized server-side in server/api/emails/share-note.post.ts. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div style="padding-top: 26px" v-html="noteContent" />
  </DefaultEmail>
</template>
