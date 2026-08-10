<script setup lang="ts">
defineProps<{
  sheet?: PlayerSheet
  loading: boolean
  error: boolean
}>()
</script>

<template>
  <Card
    v-if="error"
    test-id="error"
    class="h-[40vh] flex flex-col items-center justify-center gap-2"
  >
    <Icon name="tabler:alert-triangle" class="size-10" aria-hidden="true" />
    <p class="head-3">
      {{ $t('general.error.text') }}
    </p>
  </Card>

  <div v-else class="flex flex-col gap-4">
    <div v-if="sheet" class="flex items-center justify-between gap-2">
      <h2 test-id="title" class="head-3 truncate">
        {{ sheet.title }}
      </h2>
      <span class="text-muted-foreground shrink-0">
        {{ $t('general.round') }}:
        <span test-id="round" class="font-bold text-foreground">
          {{ sheet.round }}
        </span>
      </span>
    </div>

    <div class="flex flex-col gap-3">
      <template v-if="sheet">
        <LiveRowCard
          v-for="(row, index) in sheet.rows"
          :key="row.id"
          :row="row"
          :active="index === sheet.activeIndex"
        />
      </template>

      <template v-else-if="loading">
        <SkeletonLiveRowCard v-for="i in 4" :key="i" test-id="loading" />
      </template>
    </div>
  </div>
</template>
