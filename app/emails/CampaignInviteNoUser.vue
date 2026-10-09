<template>
  <EmailLayout
    title="Join the Adventure: Exclusive Invitation to DnD-Tracker Campaign!"
    heading="Campaign invite"
    preview="Join {{ campaign }} on DnD Tracker"
  >
    <Text class="my-4">Hi,</Text>
    <Text class="my-4">
      Great news!
      <strong v-pre>{{ invitedBy }}</strong>
      has invited you to join the "<strong v-pre>{{ campaign }}</strong
      >" campaign on <strong>DnD Tracker</strong>, your ultimate tool for
      planning and tracking epic D&D adventures.
    </Text>
    <Text class="my-4">
      To get started, create your free account on DnD Tracker:
    </Text>
    <Text class="my-4">
      👉
      <Link
        href="https://www.dnd-tracker.com/register"
        class="text-primary underline"
      >
        Create an Account & Join the Campaign
      </Link>
    </Text>
    <Text class="my-4">
      Once your account is set up, you’ll automatically be able to join the
      campaign and dive into the adventure!
    </Text>
    <Text class="my-4">
      We’re thrilled to have you join the community and can’t wait to see your
      creativity come to life.
    </Text>
  </EmailLayout>
</template>
