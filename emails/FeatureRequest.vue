<script setup lang="ts">
import { Text } from '@vue-email/components'
import DefaultEmail from './Layout/Default.vue'

defineProps<{
  email: string
  name: string
  title: string
  text: string
  id: number
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    title="New feature request"
    heading="New feature request"
    :preview="`feature request from ${name}`"
  >
    <Text class="px-4">
      DATE: {{ new Date().toLocaleDateString('nl-NL') }},
    </Text>
    <Text class="px-4">
      EMAIL: {{ email }},
    </Text>
    <Text class="px-4">
      NAME: {{ name }},
    </Text>
    <Text class="px-4">
      ID: {{ id }},
    </Text>
    <Text class="px-4">
      TITLE: {{ title }}
    </Text>
    <Text class="px-4">
      TEXT: {{ text }}
    </Text>
  </DefaultEmail>
</template>
