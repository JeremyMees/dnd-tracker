<template>
  <UiTableRow>
    <UiTableCell class="max-w-6">
      <UiSkeleton class="size-5 rounded-lg" />
    </UiTableCell>
    <UiTableCell>
      <UiSkeleton class="w-[200px] h-5 rounded-full" />
    </UiTableCell>
    <UiTableCell>
      <UiSkeleton class="w-[160px] h-5 rounded-full" />
    </UiTableCell>
    <UiTableCell>
      <UiSkeleton class="w-[75px] h-5 rounded-full" />
    </UiTableCell>
    <UiTableCell>
      <div class="flex justify-end gap-1">
        <UiSkeleton class="size-5 rounded-lg" />
        <UiSkeleton class="size-5 rounded-lg" />
        <UiSkeleton class="size-5 rounded-lg" />
      </div>
    </UiTableCell>
  </UiTableRow>
</template>
