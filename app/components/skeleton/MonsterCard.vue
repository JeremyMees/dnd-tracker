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
      <div class="flex gap-x-4 gap-y-1 flex-wrap mb-4">
        <UiSkeleton
          v-for="i in 6"
          :key="i"
          class="rounded-lg w-16 h-20"
        />
      </div>
      <div class="flex gap-x-2 gap-y-1 flex-wrap mt-2">
        <UiSkeleton class="w-34 h-5.5" />
        <UiSkeleton class="w-40 h-5.5" />
      </div>
    </UiCardContent>
    <UiCardFooter>
      <div class="flex justify-end w-full">
        <UiSkeleton class="w-[120px] h-7" />
      </div>
    </UiCardFooter>
  </UiCard>
</template>
