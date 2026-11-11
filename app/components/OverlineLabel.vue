<script setup lang="ts">
withDefaults(defineProps<{ tag?: 'h3' | 'h4' | 'p' }>(), { tag: 'h4' })
</script>

<template>
  <component
    :is="tag"
    class="text-xs font-semibold uppercase tracking-wider text-primary"
  >
    <slot />
  </component>
</template>
