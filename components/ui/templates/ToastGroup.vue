<script setup lang="ts">
const { toasts, remove } = useToast()
</script>

<template>
  <div class="fixed top-0 right-0 z-50 h-screen p-5 pointer-events-none max-w-lg w-full">
    <TransitionGroup
      enter-active-class="duration-200 ease-in-out"
      enter-from-class="!translate-x-full"
      enter-to-class="!translate-x-0"
      leave-active-class="duration-200 ease-in-out"
      leave-from-class="!translate-x-0"
      leave-to-class="!translate-x-full"
    >
      <Toast
        v-for="toast in toasts"
        :key="toast.uuid"
        :toast="toast"
        @remove="remove"
      />
    </TransitionGroup>
  </div>
</template>
