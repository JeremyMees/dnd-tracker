<script setup lang="ts">
defineProps<{ options: Option<string>[] }>()

const selected = defineModel<string>()
</script>

<template>
  <div>
    <button
      v-for="(option, i) in options"
      :key="option.value"
      class="btn-black rounded-none p-1 text-sm"
      :class="{
        'rounded-l-lg pl-3': i === 0,
        'rounded-r-lg pr-3': i === options.length - 1,
        'btn-primary': selected === option.label,
      }"
      @click="selected = option.label"
    >
      {{ option.label }}
    </button>
  </div>
</template>
