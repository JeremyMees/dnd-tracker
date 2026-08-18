<script setup lang="ts">
const props = defineProps<{
  encounterId: number
  rows: { id: string; name: string }[]
}>()

const user = useAuthenticatedUser()
const { session, active, start } = useLiveSession(props.encounterId)

const pro = computed<boolean>(() => isPro(user.value))

onMounted(() => {
  if (pro.value) start({ createIfMissing: false })
})
</script>

<template>
  <Card v-if="active" test-id="live-connected" color="secondary">
    <LiveSeatList :encounter-id="encounterId" :session="session" :rows="rows" />
  </Card>
</template>
