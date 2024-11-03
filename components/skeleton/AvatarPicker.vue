<script setup lang="ts">
withDefaults(
  defineProps<{
    profile?: boolean
    hideCreatorToggle?: boolean
    avatarBig?: boolean
  }>(), {
    profile: false,
    hideCreatorToggle: false,
    avatarBig: false,
  },
)
</script>

<template>
  <div
    class="flex flex-col items-center justify-center"
    :class="{
      'max-w-prose': profile,
    }"
  >
    <Card
      round
      no-padding
      color="primary"
      class="overflow-hidden min-w-[100px] max-w-[100px] h-[100px] animate-pulse"
      :class="{
        'lg:min-w-[200px] lg:max-w-[200px] lg:h-[200px]': avatarBig,
      }"
    >
      <div class="w-full h-full rounded-full" />
    </Card>
    <div class="bg-primary/50 border-2 border-primary rounded-lg flex w-20 h-7 relative bottom-2 backdrop-blur animate-pulse" />
  </div>
</template>
