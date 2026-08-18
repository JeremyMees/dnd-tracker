<template>
  <UiCard class="bg-secondary/50 border-secondary border-4">
    <UiCardHeader class="p-4 gap-y-1">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UiSkeleton class="size-5 rounded-lg" />
          <UiSkeleton class="w-[120px] h-6" />
        </div>
        <UiSkeleton class="w-20 h-6 rounded-full" />
      </div>
    </UiCardHeader>
    <UiCardContent class="p-4 pt-0">
      <div class="flex gap-4">
        <UiSkeleton class="w-16 h-5" />
        <UiSkeleton class="w-16 h-5" />
      </div>
    </UiCardContent>
  </UiCard>
</template>
