<script setup lang="ts">
type Props = {
  title?: string
}
defineProps<Props>()
</script>

<template>
  <div class="flex flex-col">
    <span
      v-show="title"
      class="text-lg font-semibold"
    >
      {{ title }}
    </span>
    <USeparator
      v-show="title"
      class="w-full mb-1"
      color="primary"
    />
    <slot />
  </div>
</template>
