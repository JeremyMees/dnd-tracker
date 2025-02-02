<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { AlertDialogCancel, type AlertDialogCancelProps } from 'radix-vue'
import { buttonVariants } from '@/components//ui/button'
import { cn } from '@/utils/shadcn'

const props = defineProps<AlertDialogCancelProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <AlertDialogCancel
    v-bind="delegatedProps"
    :class="cn(
      'mt-2 sm:mt-0 btn-foreground',
      props.class,
    )"
  >
    <slot />
  </AlertDialogCancel>
</template>
