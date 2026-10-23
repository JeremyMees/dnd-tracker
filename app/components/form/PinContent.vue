<script setup lang="ts">
import { INITIATIVE_SHEET } from '~~/constants/provide-keys'

const { sheet, updateSheet } = validateInject(INITIATIVE_SHEET)
</script>

<template>
  <DnDContentSearch
    variant="secondary"
    persist="local"
    :sheet="sheet"
    :update-sheet="updateSheet"
    allow-pin
  />
</template>
