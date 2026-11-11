<script setup lang="ts">
export interface ActionOption {
  value: string
  label: string
}

defineProps<{
  direct: readonly ActionOption[]
  withInputs: readonly ActionOption[]
  selected: string
  directLabel: string
  inputsLabel: string
}>()

const emit = defineEmits<{ select: [value: string] }>()
</script>

<template>
  <div class="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] content-start gap-1.5 lg:min-h-20">
    <button
      v-for="entry in [
        ...direct.map(option => ({ option, icon: 'mdi:flash-outline', hint: directLabel })),
        ...withInputs.map(option => ({ option, icon: 'mdi:tune-variant', hint: inputsLabel })),
      ]"
      :key="entry.option.value"
      type="button"
      :title="entry.hint"
      :aria-pressed="selected === entry.option.value"
      class="flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      :class="selected === entry.option.value
        ? 'border-primary bg-primary-50 text-primary'
        : 'border-default bg-default text-toned hover:border-accented hover:text-highlighted'"
      @click="emit('select', entry.option.value)"
    >
      <UIcon
        :name="entry.icon"
        class="size-4 shrink-0 opacity-70"
        aria-hidden="true"
      />
      <span class="min-w-0">{{ entry.option.label }}</span>
      <span class="sr-only">({{ entry.hint }})</span>
    </button>
  </div>
</template>
