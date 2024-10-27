<script setup lang="ts">
import { Text } from '@vue-email/components'
import DefaultEmail from './Layout/Default.vue'

defineProps<{
  email: string
  question: string
  name?: string
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    title="New question/contact"
    heading="New question/contact"
    :preview="name
      ? `Contact/question mail from ${name}`
      : 'Contact/question mail'
    "
  >
    <Text>
      DATE: {{ new Date().toLocaleDateString('nl-NL') }},
    </Text>
    <Text>
      EMAIL: {{ email }},
    </Text>
    <Text v-if="name">
      NAME: {{ name }},
    </Text>
    <Text>
      QUESTION: {{ question }}
    </Text>
  </DefaultEmail>
</template>
