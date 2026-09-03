<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { isMobile, setOpenMobile } = useSidebar()
</script>

<template>
  <UiButton
    v-if="isMobile"
    test-id="sidebar-close"
    data-sidebar="close"
    data-slot="sidebar-close"
    variant="default-ghost"
    size="icon-sm"
    :aria-label="$t('actions.close')"
    :class="cn('shrink-0', props.class)"
    @click="setOpenMobile(false)"
  >
    <Icon name="tabler:x" class="size-4" />
    <span class="sr-only">{{ $t('actions.close') }}</span>
  </UiButton>
</template>
