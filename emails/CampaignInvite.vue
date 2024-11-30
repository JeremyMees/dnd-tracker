<script setup lang="ts">
import { Text, Link } from '@vue-email/components'
import DefaultEmail from './Layout/Default.vue'

defineProps<{
  email: string
  username: string
  campaign: string
  invitedBy: string
  inviteLink: string
}>()
</script>

<template>
  <DefaultEmail
    :email="email"
    title="Join the Adventure: Exclusive Invitation to DnD-Tracker Campaign!"
    heading="Campaign invite"
    :preview="`Join ${campaign} on DnD Tracker`"
  >
    <Text class="px-4">
      Hi {{ username }},
    </Text>
    <Text class="px-4">
      Great news!
      <strong>{{ invitedBy }}</strong>
      has invited you to join the
      "<strong>{{ campaign }}</strong>"
      campaign on
      <strong>DnD Tracker</strong>.
    </Text>
    <Text class="px-4">
      Ready to start your next adventure?
    </Text>
    <Text class="px-4">
      👉
      <Link
        :href="inviteLink"
        class="text-primary underline"
      >
        Join the campaign
      </Link>
    </Text>
    <Text class="px-4">
      We’re excited to have you onboard and can’t wait to see what stories unfold!
    </Text>
  </DefaultEmail>
</template>
