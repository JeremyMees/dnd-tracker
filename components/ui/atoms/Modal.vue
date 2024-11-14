<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

withDefaults(
  defineProps<{
    big?: boolean
    title?: boolean
  }>(), {
    big: false,
    title: true,
  },
)

onKeyStroke('Escape', () => emit('close'))

const { t } = useI18n()

const open = ref<boolean>(false)

setTimeout(() => open.value = true, 50) // delay to play animation
</script>

<template>
  <Teleport to="body">
    <AnimationOpacity>
      <div
        v-if="open"
        class="fixed inset-0 bg-black/50 cursor-pointer z-20"
        @click="$emit('close')"
      />
    </AnimationOpacity>
    <AnimationScaleOpacity>
      <Card
        v-if="open"
        color="slate"
        class="backdrop-blur-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 w-full z-30"
        :class="[big ? 'max-w-[1000px]' : 'max-w-2xl']"
        aria-modal="true"
      >
        <div class="relative pb-4">
          <button
            class="absolute -top-7 -right-7 group"
            :aria-label="t('actions.close')"
            @click="$emit('close')"
          >
            <Icon
              name="ic:round-clear"
              class="text-danger size-8 rounded-full ring-danger group-focus-within:ring"
              aria-hidden="true"
            />
          </button>
          <slot name="header" />
        </div>
        <div
          class="overflow-auto max-h-[75vh]"
          :class="{ 'mt-6': title }"
        >
          <slot />
        </div>
        <div class="inset-0 z-[-1] fancy-shadow" />
      </Card>
    </AnimationScaleOpacity>
  </Teleport>
</template>
