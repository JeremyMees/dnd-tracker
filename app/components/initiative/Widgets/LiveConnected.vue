<script setup lang="ts">
const props = defineProps<{
  encounterId: number
  rows: { id: string; name: string }[]
}>()

const user = useAuthenticatedUser()
const { session, active, start } = useLiveSession(props.encounterId)

const pro = computed<boolean>(() => isPro(user.value))

onMounted(() => {
  if (pro.value) start()
})
</script>

<template>
  <Card v-if="active" test-id="live-connected" color="secondary">
    <InitiativeLiveSeatList
      :encounter-id="encounterId"
      :session="session"
      :rows="rows"
    />
  </Card>
</template>
