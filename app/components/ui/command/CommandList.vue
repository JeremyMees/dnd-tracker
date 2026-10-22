<script setup lang="ts">
import type { ListboxContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ListboxContent, useForwardProps } from 'reka-ui'
import { ScrollArea } from '@/components/ui/scroll-area'

const props = defineProps<
  ListboxContentProps & { class?: HTMLAttributes['class'] }
>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <ListboxContent
    v-bind="forwarded"
    :class="cn('flex max-h-[300px] flex-col', props.class)"
  >
    <ScrollArea class="min-h-0">
      <div role="presentation">
        <slot />
      </div>
    </ScrollArea>
  </ListboxContent>
</template>
