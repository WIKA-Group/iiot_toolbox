<script setup lang="ts">
defineProps<{
  items: readonly { label: string, value: string }[]
  placeholder?: string
}>()

const model = defineModel<string>({ default: '' })

const { t } = useI18n()
</script>

<template>
  <USelect
    :model-value="model || undefined"
    class="w-full"
    :items="[...items]"
    value-key="value"
    :placeholder="placeholder ?? t('encoder.unchanged')"
    @update:model-value="value => model = String(value ?? '')"
  >
    <template #trailing>
      <span class="flex items-center gap-0.5">
        <!-- Pointer events are stopped so clearing does not open the menu. -->
        <UButton
          v-if="model"
          color="neutral"
          variant="link"
          size="xs"
          icon="mdi:close"
          class="p-0.5"
          :aria-label="t('encoder.clear')"
          @pointerdown.stop
          @click.stop="model = ''"
        />
        <UIcon
          name="mdi:chevron-down"
          class="size-4 text-dimmed"
        />
      </span>
    </template>
  </USelect>
</template>
