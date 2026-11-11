<script setup lang="ts">
const props = defineProps<{

  items: readonly { value: string, label: string }[]

  label: string

  showLabel?: boolean

  // chips: outlined round pills for a secondary choice next to a segmented control
  variant?: 'segmented' | 'chips'
}>()

const model = defineModel<string>({ required: true })

const radioItems = computed(() => props.items.map(item => ({ label: item.label, value: item.value })))
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span
      v-if="showLabel"
      class="text-sm font-medium text-toned"
    >{{ label }}</span>

    <URadioGroup
      v-model="model"
      :items="radioItems"
      :aria-label="label"
      variant="card"
      indicator="hidden"
      orientation="horizontal"
      value-key="value"
      :ui="variant === 'chips' ? {
        fieldset: 'flex flex-wrap items-center gap-1.5',
        item: [
          'flex-none cursor-pointer select-none rounded-full border border-default bg-default p-0 transition-colors',
          'hover:border-accented',
          'has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-1',
        ].join(' '),
        wrapper: 'px-3 py-1 text-center [@media(pointer:coarse)]:py-2.5',
        label: [
          'block text-sm font-medium text-toned transition-colors cursor-pointer',
          'group-has-[[data-state=checked]]:text-primary',
        ].join(' '),
      } : {
        fieldset: 'flex flex-wrap gap-1 rounded-sm bg-accented p-1 w-fit max-w-full',
        item: [
          'flex-none cursor-pointer select-none rounded-xs border-0 p-0 transition-colors',
          'has-[[data-state=checked]]:bg-default has-[[data-state=checked]]:shadow-elevation-1',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-accented',
        ].join(' '),
        wrapper: 'px-3 py-1.5 text-center [@media(pointer:coarse)]:py-3',
        label: [
          'block text-sm font-medium text-toned transition-colors cursor-pointer',
          'group-has-[[data-state=checked]]:text-primary',
        ].join(' '),
      }"
    >
      <template #label="{ item, modelValue }">
        <span :class="modelValue === item.value ? 'text-primary' : ''">{{ item.label }}</span>
      </template>
    </URadioGroup>
  </div>
</template>
