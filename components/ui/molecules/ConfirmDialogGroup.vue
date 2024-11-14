<script setup lang="ts">
const { dialogs, handlers } = useConfirmDialogs()
</script>

<template>
  <ConfirmDialog
    v-for="dialog in dialogs"
    :key="dialog.uuid"
    v-bind="dialog"
    v-on="handlers"
  />
</template>
