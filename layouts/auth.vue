<script setup lang="ts">
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="flex flex-col gap-4 p-6 md:p-10">
      <div class="flex justify-center gap-2 md:justify-start">
        <NuxtLinkLocale to="/">
          <NuxtImg
            src="/logo.svg"
            alt="Image"
            width="100"
            height="100"
          />
        </NuxtLinkLocale>
      </div>
      <div class="flex flex-1 items-center justify-center">
        <div class="w-full max-w-xs">
          <slot />
        </div>
      </div>
    </div>
    <div class="relative hidden bg-muted lg:flex flex-col items-center justify-center">
      <slot name="right" />
    </div>
  </div>
</template>
