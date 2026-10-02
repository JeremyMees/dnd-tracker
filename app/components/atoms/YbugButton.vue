<script setup lang="ts">
defineProps<{ type: 'menu' | 'footer' }>()
</script>

<template>
  <button
    class="flex items-center"
    :class="{
      'gap-2 w-full cursor-pointer': type === 'menu',
      'text-sm': type === 'footer',
    }"
    @click="$ybug?.open('feedback')"
  >
    <Icon
      name="tabler:bug"
      class="size-4 min-w-4"
      :class="{
        'mr-2 text-muted-foreground': type === 'footer',
      }"
    />
    {{ $t('components.navbar.bug') }}
  </button>
</template>
