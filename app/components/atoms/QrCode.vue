<script setup lang="ts">
import encodeQR from 'qr'

const props = defineProps<{
  value: string
}>()

const svg = computed<string>(() => encodeQR(props.value, 'svg'))
</script>

<template>
  <div test-id="qr-code" class="qr-code bg-white p-2 rounded-lg w-fit">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="size-32" v-html="svg" />
  </div>
</template>

<style scoped>
.qr-code :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
