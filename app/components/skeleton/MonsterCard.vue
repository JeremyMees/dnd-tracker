<template>
  <UiCard class="bg-background/50 border-4 border-background">
    <UiCardHeader>
      <UiCardTitle>
        <UiSkeleton class="w-[120px] h-7" />
      </UiCardTitle>
      <div class="flex gap-4 mt-1">
        <UiSkeleton class="w-10 h-6" />
        <UiSkeleton class="w-10 h-6" />
        <UiSkeleton class="w-10 h-6" />
      </div>
    </UiCardHeader>
    <UiCardContent>
      <UiSkeleton class="w-full h-16" />
    </UiCardContent>
    <UiCardFooter>
      <div class="flex justify-end w-full">
        <UiSkeleton class="w-[120px] h-7" />
      </div>
    </UiCardFooter>
  </UiCard>
</template>
