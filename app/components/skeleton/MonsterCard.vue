<template>
  <UiCardBase class="bg-background/50 border-4 border-background">
    <UiCardHeader>
      <UiCardTitle>
        <UiSkeletonBase class="w-[120px] h-7" />
      </UiCardTitle>
      <div class="flex gap-4 mt-1">
        <UiSkeletonBase class="w-10 h-6" />
        <UiSkeletonBase class="w-10 h-6" />
        <UiSkeletonBase class="w-10 h-6" />
      </div>
    </UiCardHeader>
    <UiCardContent>
      <UiSkeletonBase class="w-full h-16" />
    </UiCardContent>
    <UiCardFooter>
      <div class="flex justify-end w-full">
        <UiSkeletonBase class="w-[120px] h-7" />
      </div>
    </UiCardFooter>
  </UiCardBase>
</template>
