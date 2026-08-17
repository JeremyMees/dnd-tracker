<template>
  <UiTableRow>
    <UiTableCell class="p-2">
      <div class="flex items-center gap-2">
        <UiSkeleton class="size-5 rounded-lg" />
        <UiSkeleton class="w-[160px] h-5 rounded-full" />
      </div>
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="w-6 h-5" />
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="w-12 h-5" />
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="w-6 h-5" />
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="w-20 h-6 rounded-full" />
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="w-24 h-6 rounded-full" />
    </UiTableCell>
    <UiTableCell class="p-2">
      <div class="grid gap-1 w-fit">
        <div class="grid grid-cols-3 gap-1 w-14">
          <UiSkeleton class="size-4 rounded" />
          <UiSkeleton class="size-4 rounded" />
          <UiSkeleton class="size-4 rounded" />
        </div>
        <div class="grid grid-cols-3 gap-1 w-14">
          <UiSkeleton class="size-4 rounded" />
          <UiSkeleton class="size-4 rounded" />
          <UiSkeleton class="size-4 rounded" />
        </div>
      </div>
    </UiTableCell>
    <UiTableCell class="p-2">
      <UiSkeleton class="size-4 rounded-full" />
    </UiTableCell>
  </UiTableRow>
</template>
