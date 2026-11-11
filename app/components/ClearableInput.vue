<script setup lang="ts">
const props = withDefaults(defineProps<{
  unit?: string
  clearable?: boolean
  block?: boolean
  type?: string
  min?: number
  max?: number
  step?: number | string
}>(), { clearable: true, block: true, type: 'number' })

const model = defineModel<string>({ default: '' })

const { t } = useI18n()

const isNumber = computed(() => props.type === 'number')

const stepSize = computed(() => {
  const size = Number(props.step)
  return Number.isFinite(size) && size > 0 ? size : 1
})

function nudge(direction: 1 | -1) {
  const current = Number(model.value)
  let next = model.value === '' || !Number.isFinite(current)
    ? props.min ?? 0
    : current + direction * stepSize.value
  if (props.min !== undefined) next = Math.max(props.min, next)
  if (props.max !== undefined) next = Math.min(props.max, next)
  model.value = String(Number(next.toFixed(10)))
}
</script>

<template>
  <!-- Native spinners are hidden globally; the stepper sits where a select shows its chevron. -->
  <UInput
    :model-value="model"
    :type="type"
    :min="min"
    :max="max"
    :step="step"
    :class="block ? 'w-full' : ''"
    @update:model-value="value => model = String(value ?? '')"
  >
    <template
      v-if="unit || (clearable && model) || isNumber"
      #trailing
    >
      <span class="flex items-center gap-0.5">
        <span
          v-if="unit"
          class="me-1 text-xs text-dimmed"
        >{{ unit }}</span>
        <UButton
          v-if="clearable && model"
          color="neutral"
          variant="link"
          size="xs"
          icon="mdi:close"
          class="p-0.5"
          :aria-label="t('encoder.clear')"
          @click="() => { model = '' }"
        />
        <!-- Pointer-only (keyboard users step with the arrow keys); hidden but still reserved on touch screens. -->
        <span
          v-if="isNumber"
          class="relative size-4 text-dimmed [@media(pointer:coarse)]:invisible"
          aria-hidden="true"
        >
          <UIcon
            name="mdi:unfold-more-horizontal"
            class="size-4"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute -inset-x-1 -top-1 h-[calc(50%+0.25rem)] cursor-pointer"
            @mousedown.prevent
            @click="nudge(1)"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute -inset-x-1 -bottom-1 h-[calc(50%+0.25rem)] cursor-pointer"
            @mousedown.prevent
            @click="nudge(-1)"
          />
        </span>
      </span>
    </template>
  </UInput>
</template>
