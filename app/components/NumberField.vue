<script setup lang="ts">
const props = defineProps<{
  min?: number
  max?: number
  integer?: boolean
  unit?: string
  fallbackPlaceholder?: string
}>()

const model = defineModel<string>({ default: '' })

const placeholder = computed(() => {
  if (props.min !== undefined && props.max !== undefined) return `${props.min} – ${props.max}`
  if (props.min !== undefined) return `≥ ${props.min}`
  if (props.max !== undefined) return `≤ ${props.max}`
  return props.fallbackPlaceholder
})
</script>

<template>
  <ClearableInput
    v-model="model"
    :unit="unit"
    :min="min"
    :max="max"
    :step="integer ? 1 : 'any'"
    :placeholder="placeholder"
  />
</template>
