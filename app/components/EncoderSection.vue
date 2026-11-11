<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  level?: 2 | 3
  boxed?: boolean
  subtitle?: string
}>(), {
  level: 2,
})
</script>

<template>
  <section
    class="flex flex-col gap-3"
  >
    <div
      v-if="title || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
      :class="level === 2 ? 'min-h-9' : ''"
    >
      <div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
        <component
          :is="`h${level}`"
          v-if="title"
          :class="level === 2
            ? 'text-lg font-semibold text-highlighted'
            : 'text-base font-semibold text-toned'"
        >
          {{ title }}
        </component>
        <slot name="afterTitle" />
      </div>
      <div
        v-if="$slots.actions"
        class="ms-auto"
      >
        <slot name="actions" />
      </div>
    </div>
    <p
      v-if="subtitle"
      class="-mt-1 text-sm text-muted"
    >
      {{ subtitle }}
    </p>
    <div
      v-if="boxed"
      class="flex flex-col gap-4 rounded-md border border-default bg-default p-4"
    >
      <slot />
    </div>
    <slot v-else />
  </section>
</template>
