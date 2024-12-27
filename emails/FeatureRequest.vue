<script setup lang="ts">
import { Text } from '@vue-email/components'
import DefaultEmail from './Layout/Default.vue'

defineProps<{
  email: string
  name: string
  title: string
  text: string
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    title="New feature request"
    heading="New feature request"
    :preview="`feature request from ${name}`"
  >
    <Text>
      DATE: {{ new Date().toLocaleDateString('nl-NL') }},
    </Text>
    <Text>
      EMAIL: {{ email }},
    </Text>
    <Text>
      NAME: {{ name }},
    </Text>
    <Text>
      TITLE: {{ title }}
    </Text>
    <Text>
      TEXT: {{ text }}
    </Text>
  </DefaultEmail>
</template>
