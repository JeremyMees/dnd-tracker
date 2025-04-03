<script setup lang="ts">
useSeo('Fantasy name generator')
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('components.navbar.fantasy')"
  >
    <div class="flex flex-col justify-center h-full">
      <UiCard class="w-full dnd-container">
        <UiCardContent class="pt-6">
          <FantasyNameGenerator :amount="30" />
        </UiCardContent>
      </UiCard>
    </div>
  </NuxtLayout>
</template>
