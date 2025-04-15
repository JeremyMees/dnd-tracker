<script setup lang="ts">
import { inject } from 'vue'

defineProps<{ type: 'menu' | 'footer' }>()

const ybug = inject<{ open: (type: string) => void }>('ybug')
</script>

<template>
  <button
    class="flex items-center"
    :class="{
      'gap-2 w-full cursor-pointer': type === 'menu',
    }"
    @click="ybug?.open('feedback')"
  >
    <Icon
      name="tabler:bug"
      :class="{
        'size-4 min-w-4': type === 'menu',
        'min-w-6 min-h-6 mr-2': type === 'footer',
      }"
    />
    {{ $t('components.navbar.bug') }}
  </button>
</template>
