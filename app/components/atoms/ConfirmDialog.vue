<script setup lang="ts">
defineEmits<{
  confirm: [uuid: string]
  decline: [uuid: string]
}>()

withDefaults(
  defineProps<{
    uuid: string
    title: string
    description: string
    confirmText: string
    declineText: string
    loading?: boolean
    closing?: boolean
    callback: ConfirmCallback
  }>(),
  {
    type: 'danger',
    loading: false,
    closing: false,
  },
)
</script>

<template>
  <UiAlertDialog :open="!closing">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>
          {{ title }}
        </UiAlertDialogTitle>
        <UiAlertDialogDescription>
          {{ description }}
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="$emit('decline', uuid)">
          {{ declineText }}
        </UiAlertDialogCancel>
        <UiAlertDialogAction @click="$emit('confirm', uuid)">
          {{ confirmText }}
        </UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
