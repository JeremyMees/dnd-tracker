<template>
  <EmailLayout
    title="New question/contact"
    heading="New question/contact"
    preview="Contact/question mail{{#name}} from {{ name }}{{/name}}"
  >
    <Text class="my-4">
      DATE: <span v-pre>{{ date }}</span
      >,
    </Text>
    <Text class="my-4">
      EMAIL: <span v-pre>{{ email }}</span
      >,
    </Text>
    <Raw content="{{#name}}" />
    <Text class="my-4">
      NAME: <span v-pre>{{ name }}</span
      >,
    </Text>
    <Raw content="{{/name}}" />
    <Text class="my-4">
      QUESTION: <span v-pre>{{ question }}</span>
    </Text>
  </EmailLayout>
</template>
