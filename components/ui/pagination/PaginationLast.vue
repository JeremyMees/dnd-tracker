<script setup lang="ts">
import { PaginationLast, type PaginationLastProps } from 'radix-vue'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/utils/shadcn'

const props = withDefaults(defineProps<PaginationLastProps & { class?: HTMLAttributes['class'] }>(), {
  asChild: true,
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationLast v-bind="delegatedProps">
    <button :class="cn('size-8 border-4 border-secondary rounded-lg p-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed', props.class)">
      <slot>
        <Icon
          name="tabler:chevrons-right"
          class="size-4 min-w-4"
        />
      </slot>
    </button>
  </PaginationLast>
</template>
