<template>
  <div class="min-h-screen relative overflow-hidden">
    <NuxtLinkLocale
      class="absolute inset-0 bg-transparent cursor-pointer"
      to="/"
    />
    <div
      class="sm:dnd-container absolute w-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
    >
      <div class="inset-0 z-[-1] fancy-shadow" />
      <div
        class="max-w-prose bg-background py-4 px-2 sm:p-6 sm:rounded-lg relative border-4 border-muted mx-auto"
      >
        <img
          src="/gifs/wolf-rider.gif"
          loading="lazy"
          class="size-8 absolute -top-8"
        >
        <NuxtLinkLocale
          to="/"
          class="absolute size-4 right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <Icon
            name="tabler:x"
            class="size-4 min-w-4"
            aria-hidden="true"
          />
        </NuxtLinkLocale>
        <section class="px-4 mx-h-full max-h-[90dvh] flex flex-col gap-y-6">
          <slot name="header" />
          <div class="overflow-y-auto px-1">
            <slot />
          </div>
          <slot name="footer" />
        </section>
      </div>
    </div>
  </div>
</template>
