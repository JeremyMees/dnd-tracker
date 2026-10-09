<template>
  <EmailLayout
    title="New Note Shared from {{ campaign }}!"
    heading="Shared campaign note"
    preview="Shared campaign note"
  >
    <Text class="my-4">Hi adventurer,</Text>
    <Text class="my-4">
      <strong v-pre>{{ sharedBy }}</strong>
      has shared a note with you from the
      <strong v-pre>{{ campaign }}</strong>
      campaign, titled "<strong v-pre>{{ noteTitle }}</strong
      >".
    </Text>
    <Hr class="bg-border" />
    <div v-pre class="pt-6.5">{{{ noteContent }}}</div>
  </EmailLayout>
</template>
