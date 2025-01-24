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
    loading: boolean
    callback: (confirmed: boolean) => any
  }>(), {
    type: 'danger',
    loading: false,
  },
)
</script>

<template>
  <UiAlertDialog open>
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
