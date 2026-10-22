<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
import ScrollBar from './ScrollBar.vue'

const props = withDefaults(
  defineProps<
    ScrollAreaRootProps & {
      class?: HTMLAttributes['class']
      viewportClass?: HTMLAttributes['class']
      orientation?: 'vertical' | 'horizontal'
    }
  >(),
  { orientation: 'vertical' },
)

const delegatedProps = reactiveOmit(
  props,
  'class',
  'viewportClass',
  'orientation',
)

const root = useTemplateRef<InstanceType<typeof ScrollAreaRoot>>('root')

defineExpose({ viewport: computed(() => root.value?.viewport) })
</script>

<template>
  <ScrollAreaRoot
    ref="root"
    data-slot="scroll-area"
    v-bind="delegatedProps"
    :class="cn('relative flex flex-col overflow-hidden', props.class)"
  >
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      :class="
        cn(
          'min-h-0 flex-1 rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:ring-3 focus-visible:ring-ring/50',
          orientation === 'vertical' ? 'scroll-fade' : 'scroll-fade-x',
          props.viewportClass,
        )
      "
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollBar :orientation />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
