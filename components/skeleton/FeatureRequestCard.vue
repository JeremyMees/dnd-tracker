<template>
  <Card
    color="background"
    class="flex flex-col gap-4"
  >
    <div class="flex gap-x-4 flex-1">
      <div class="flex flex-col gap-y-1">
        <div class="w-10 h-14 rounded-lg bg-tracker" />
        <div class="w-10 h-14 rounded-lg bg-tracker" />
      </div>

      <div class="flex flex-col w-full flex-1 items-start justify-between gap-y-2">
        <div class="flex items-end gap-2">
          <div class="w-10 h-10 rounded-lg bg-tracker" />
          <div class="w-16 h-4 rounded-full bg-tracker" />
        </div>
        <div class="flex items-end gap-2">
          <div class="w-[200px] h-5 rounded-full bg-tracker" />
          <div class="w-10 h-3 rounded-full bg-tracker" />
        </div>
        <div class="w-full h-10 rounded-lg bg-tracker" />
      </div>
    </div>
  </Card>
</template>
