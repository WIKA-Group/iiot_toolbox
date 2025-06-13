<script setup lang="ts">
type Props = {
  tooltip?: string
}
defineProps<Props>()
</script>

<template>
  <!-- Extension of https://ui.nuxt.com/components/form-field with custom tooltip, usage is identical to default UFormField  -->
  <UFormField
    class="mt-3"
    :ui="{
      label: 'relative',
    }"
  >
    <!-- Only show tooltip on label when there is a label at all and content given -->
    <template
      v-if="($slots.tooltip || tooltip) && $attrs.label"
      #label="{ label }"
    >
      {{ label }}
      <UPopover arrow>
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
    <slot />
  </UFormField>
</template>
