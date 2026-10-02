<script setup lang="ts">
useSeo('No access')

const route = useRoute()

const key = computed<string>(() =>
  route.query.reason === 'expired'
    ? 'pages.noAccess.expired'
    : 'pages.noAccess',
)
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h2 test-id="title">
        {{ $t(`${key}.title`) }}
      </h2>
    </template>

    <p test-id="text" class="text-muted-foreground">
      {{ $t(`${key}.text`) }}
    </p>
  </NuxtLayout>
</template>
