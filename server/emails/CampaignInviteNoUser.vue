<script setup lang="ts">
import { Text } from '@vue-email/text'
import { Link } from '@vue-email/link'
import DefaultEmail from './Layout/Default.vue'
import { colors } from './theme'

defineProps<{
  email: string
  campaign: string
  invitedBy: string
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    title="Join the Adventure: Exclusive Invitation to DnD-Tracker Campaign!"
    heading="Campaign invite"
    :preview="`Join ${campaign} on DnD Tracker`"
  >
    <Text> Hi, </Text>
    <Text>
      Great news!
      <strong>{{ invitedBy }}</strong>
      has invited you to join the "<strong>{{ campaign }}</strong
      >" campaign on <strong>DnD Tracker</strong>, your ultimate tool for
      planning and tracking epic D&D adventures.
    </Text>
    <Text> To get started, create your free account on DnD Tracker: </Text>
    <Text>
      👉
      <Link
        href="https://dnd-tracker.com/register"
        :style="`color: ${colors.primary}; text-decoration: underline`"
      >
        Create an Account & Join the Campaign
      </Link>
    </Text>
    <Text>
      Once your account is set up, you’ll automatically be able to join the
      campaign and dive into the adventure!
    </Text>
    <Text>
      We’re thrilled to have you join the community and can’t wait to see your
      creativity come to life.
    </Text>
  </DefaultEmail>
</template>
