<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div
      class="flex flex-col gap-y-6 items-center max-w-prose px-8 text-center"
    >
      <h1 test-id="title">
        {{ $t('pages.maintenance.title') }}
      </h1>
      <p test-id="text" class="text-muted-foreground">
        {{ $t('pages.maintenance.text') }}
      </p>
    </div>
  </div>
</template>
