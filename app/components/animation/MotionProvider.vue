<script setup lang="ts">
import { LazyMotion, domAnimation } from 'motion-v'
</script>

<template>
  <LazyMotion :features="domAnimation" strict>
    <slot />
  </LazyMotion>
</template>
