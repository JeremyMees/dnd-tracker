<script setup lang="ts">
defineProps<{ link: string }>()

const textVisible = ref<boolean>(true)
const button = ref<HTMLButtonElement>()

onMounted(() => animateText())

function animateText() {
  setTimeout(() => textVisible.value = false, 4000)
}
</script>

<template>
  <div
    ref="button"
    class="bg-primary/50 overflow-hidden rounded-full transition-all duration-700 p-1 border-2 border-primary w-fit"
    @mouseenter="textVisible = true"
    @mouseleave="textVisible = false"
  >
    <RouteLink
      :url="link"
      class="flex items-center"
      :class="{ 'pr-2': textVisible }"
    >
      <Icon
        class="size-6"
        name="tabler:chevron-left"
        aria-hidden="true"
      />
      <span
        v-if="textVisible"
        class="font-bold"
      >
        {{ $t('general.back') }}
      </span>
    </RouteLink>
  </div>
</template>
