<template>
  <div class="grid sm:grid-cols-3 gap-x-4 gap-y-2 sm:items-center sm:justify-between text-sm border-b border-secondary mb-2 pb-1 last:border-none last:mb-0 last:pb-0">
    <div class="flex items-center gap-2">
      <UiSkeleton class="size-9 min-w-9 rounded-full" />
      <div class="flex flex-col gap-y-1">
        <UiSkeleton class="w-[80px] h-4 rounded-full" />
        <UiSkeleton class="w-[70px] h-4 rounded-full" />
      </div>
    </div>
    <UiSkeleton class="w-[80px] h-4 rounded-full" />
    <div class="flex sm:justify-end items-center">
      <UiSkeleton class="size-6 rounded-lg" />
    </div>
  </div>
</template>
