<template>
  <div class="flex gap-2 rounded-sm border-l-2 border-primary/40 bg-elevated/60 px-3 py-2 text-xs text-muted">
    <UIcon
      name="mdi:information-outline"
      class="mt-0.5 size-4 shrink-0 text-primary"
      aria-hidden="true"
    />
    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
