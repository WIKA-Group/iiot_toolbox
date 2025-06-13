<script setup lang="ts">
type Props = {
  title?: string
  tooltip?: string
}
defineProps<Props>()
</script>

<template>
  <div class="bg-inherit pt-2 h-full w-full">
    <UCard
      variant="subtle"
      class="h-full w-full"
      :ui="{
        body: 'p-2 sm:p-2 ',
      }"
    >
      <span
        v-if="title"
        class="font-semibold text-sm relative"
      >
        {{ title }}
        <UPopover
          v-if="tooltip || $slots.tooltip"
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
      </span>

      <slot />
    </UCard>
  </div>
</template>
