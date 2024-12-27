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
    <Text>
      Hi {{ username }},
    </Text>
    <Text>
      Great news!
      <strong>{{ invitedBy }}</strong>
      has invited you to join the
      "<strong>{{ campaign }}</strong>"
      campaign on
      <strong>DnD Tracker</strong>.
    </Text>
    <Text>
      Ready to start your next adventure?
    </Text>
    <Text>
      👉
      <Link
        :href="inviteLink"
        class="text-primary underline"
      >
        Join the campaign
      </Link>
    </Text>
    <Text>
      We’re excited to have you onboard and can’t wait to see what stories unfold!
    </Text>
  </DefaultEmail>
</template>
