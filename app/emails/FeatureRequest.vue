<template>
  <EmailLayout
    title="New feature request"
    heading="New feature request"
    preview="feature request from {{ name }}"
  >
    <Text class="my-4">
      DATE: <span v-pre>{{ date }}</span
      >,
    </Text>
    <Text class="my-4">
      EMAIL: <span v-pre>{{ email }}</span
      >,
    </Text>
    <Text class="my-4">
      NAME: <span v-pre>{{ name }}</span
      >,
    </Text>
    <Text class="my-4">
      TITLE: <span v-pre>{{ title }}</span>
    </Text>
    <Text class="my-4">
      TEXT: <span v-pre>{{ text }}</span>
    </Text>
  </EmailLayout>
</template>
