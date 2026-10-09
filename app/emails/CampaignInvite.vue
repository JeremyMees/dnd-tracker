<template>
  <EmailLayout
    title="Join the Adventure: Exclusive Invitation to DnD-Tracker Campaign!"
    heading="Campaign invite"
    preview="Join {{ campaign }} on DnD Tracker"
  >
    <Text class="my-4">
      Hi <span v-pre>{{ username }}</span
      >,
    </Text>
    <Text class="my-4">
      Great news!
      <strong v-pre>{{ invitedBy }}</strong>
      has invited you to join the "<strong v-pre>{{ campaign }}</strong
      >" campaign on <strong>DnD Tracker</strong>.
    </Text>
    <Text class="my-4">Ready to start your next adventure?</Text>
    <Text class="my-4">
      👉
      <Link href="{{ inviteLink }}" class="text-primary underline">
        Join the campaign
      </Link>
    </Text>
    <Text class="my-4">
      We’re excited to have you onboard and can’t wait to see what stories
      unfold!
    </Text>
  </EmailLayout>
</template>
