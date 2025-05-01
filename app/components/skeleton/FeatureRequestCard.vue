<template>
  <UiCard>
    <UiCardHeader>
      <UiCardTitle>
        <div class="flex items-center gap-x-2">
          <UiSkeleton class="size-9 rounded-full" />
          <UiSkeleton class="w-[200px] h-6 rounded-full" />
        </div>
      </UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div class="flex gap-x-4 flex-1">
        <div class="flex flex-col gap-y-1">
          <UiSkeleton class="w-10 h-12 rounded-LG" />
          <UiSkeleton class="w-10 h-12 rounded-lg" />
        </div>
        <UiSkeleton class="w-full rounded-lg" />
      </div>
    </UiCardContent>
  </UiCard>
</template>
