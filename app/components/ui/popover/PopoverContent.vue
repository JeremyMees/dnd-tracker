<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 4,
    collisionPadding: 16,
    class: '',
  },
)
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      data-slot="popover-content"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="
        cn(
          'border-muted bg-background max-w-[min(400px,calc(100vw-2rem))] max-h-[450px] flex flex-col text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 rounded-lg border-4 p-4 shadow-md origin-(--reka-popover-content-transform-origin) outline-hidden',
          props.class,
        )
      "
    >
      <ScrollArea class="-m-4 min-h-0" viewport-class="p-4">
        <slot />
      </ScrollArea>
    </PopoverContent>
  </PopoverPortal>
</template>
