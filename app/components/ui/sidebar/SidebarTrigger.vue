<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useSidebar } from './utils'
import { Button } from '@/components//ui/button'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Tooltip :text="$t('actions.toggleSidebar')">
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="default-ghost"
      size="icon"
      :class="cn('h-7 w-7', props.class)"
      @click="toggleSidebar"
    >
      <Icon name="tabler:layout-sidebar" class="size-4" />
      <span class="sr-only">{{ $t('actions.toggleSidebar') }}</span>
    </Button>
  </Tooltip>
</template>
