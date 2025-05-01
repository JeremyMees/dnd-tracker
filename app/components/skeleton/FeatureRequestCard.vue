<template>
  <UiCardBase>
    <UiCardHeader>
      <UiCardTitle>
        <div class="flex items-center gap-x-2">
          <UiSkeletonBase class="size-9 rounded-full" />
          <UiSkeletonBase class="w-[200px] h-6 rounded-full" />
        </div>
      </UiCardTitle>
    </UiCardHeader>
    <UiCardContent>
      <div class="flex gap-x-4 flex-1">
        <div class="flex flex-col gap-y-1">
          <UiSkeletonBase class="w-10 h-12 rounded-LG" />
          <UiSkeletonBase class="w-10 h-12 rounded-lg" />
        </div>
        <UiSkeletonBase class="w-full rounded-lg" />
      </div>
    </UiCardContent>
  </UiCardBase>
</template>
