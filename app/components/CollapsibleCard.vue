<script setup lang="ts">
defineProps<{
  title: string
  open: boolean
  badge?: string
}>()

const emit = defineEmits<{ toggle: [] }>()

const panelId = useId()
</script>

<template>
  <div class="overflow-hidden rounded-md border border-default bg-default">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between gap-3 bg-elevated/40 px-3 py-2.5 text-left text-highlighted transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="emit('toggle')"
    >
      <span class="text-sm font-semibold">{{ title }}</span>
      <span class="flex shrink-0 items-center gap-2">
        <span
          v-if="badge"
          class="rounded-xs bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
        >{{ badge }}</span>
        <UIcon
          :name="open ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"
          class="size-5 text-muted"
        />
      </span>
    </button>

    <div
      v-if="open"
      :id="panelId"
      class="border-t border-default p-3"
    >
      <slot />
    </div>
  </div>
</template>
