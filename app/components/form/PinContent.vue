<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const { sheet, update } = validateInject(INITIATIVE_SHEET)
</script>

<template>
  <DnDContentSearch
    variant="background"
    :sheet="sheet"
    :update="update"
    allow-pin
  />
</template>
