<script setup lang="ts">
type Props = {
  tooltip?: string
  // Marks the field and explains it in a tooltip; the full text is shown in the result panel, so nothing shifts.
  problem?: string
  notice?: string
  // Keeps the label for screen readers only, e.g. when a table header already names the column.
  hideLabel?: boolean
}
defineProps<Props>()
</script>

<template>
  <!-- Extension of https://ui.nuxt.com/components/form-field with custom tooltip, usage is identical to default UFormField  -->
  <UFormField
    :class="hideLabel ? '' : 'mt-3'"
    :error="problem ? true : undefined"
    :ui="{
      root: 'flex flex-col justify-end',
      label: hideLabel ? 'sr-only' : 'relative text-sm font-medium text-highlighted',
      container: hideLabel ? 'mt-0' : undefined,
      help: 'mt-1 text-xs text-muted',
    }"
  >
    <!-- Only show tooltip on label when there is a label at all and content given -->
    <template
      v-if="($slots.tooltip || tooltip || problem || notice) && $attrs.label && !hideLabel"
      #label="{ label }"
    >
      {{ label }}
      <FieldProblem
        v-if="problem"
        :message="problem"
      />
      <FieldProblem
        v-else-if="notice"
        :message="notice"
        kind="warning"
      />
      <UPopover
        v-if="$slots.tooltip || tooltip"
        arrow
      >
        <UButton
          icon="mdi:help-circle"
          size="xs"
          variant="link"
          class="absolute -top-3 -right-5"
        />
        <template #content>
          <div class="max-w-md p-2">
            <slot name="tooltip">
              {{ tooltip }}
            </slot>
          </div>
        </template>
      </UPopover>
    </template>
    <template
      v-if="$slots.hint"
      #hint
    >
      <slot name="hint" />
    </template>
    <slot />
  </UFormField>
</template>
