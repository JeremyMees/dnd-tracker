<script setup lang="ts">
useSeo('DnD Content')
</script>

<template>
  <NuxtLayout
    name="sidebar"
    :header="$t('components.navbar.dnd-content')"
  >
    <DnDContentSearch />
  </NuxtLayout>
</template>
