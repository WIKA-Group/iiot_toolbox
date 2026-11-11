<script setup lang="ts">
defineProps<{
  message: string
  kind?: 'error' | 'warning'
}>()
</script>

<template>
  <UTooltip :text="message">
    <UIcon
      :name="kind === 'warning' ? 'mdi:alert-outline' : 'mdi:alert-circle'"
      class="ms-1 inline size-4 align-text-bottom"
      :class="kind === 'warning' ? 'text-warning' : 'text-error'"
      tabindex="0"
    />
  </UTooltip>
  <span class="sr-only">{{ message }}</span>
</template>
