<script setup lang="ts">
withDefaults(
  defineProps<{
    text: string
    split: string
    classes?: string
    tag?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  }>(), {
    classes: '',
    tag: 'p',
  },
)
</script>

<template>
  <component :is="tag">
    <template
      v-for="part in text.split(split)"
      :key="part"
    >
      {{ part }}
      <span
        :class="classes"
        class="last:hidden"
      >
        {{ split }}
      </span>
    </template>
  </component>
</template>
