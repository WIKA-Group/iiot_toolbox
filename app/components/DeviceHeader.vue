<script setup lang="ts">
const props = defineProps<{
  device: DeviceEntry
  downloadError?: string
}>()

const emit = defineEmits<{ download: [] }>()

const summary = computed(() => {
  const measurand = measurandOf(props.device)
  const protocols = props.device.decodes.join(', ')
  return [measurand, protocols].filter(Boolean).join(' · ')
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
    <NuxtImg
      :src="device.img"
      alt=""
      format="webp"
      class="h-header-device w-auto max-w-16 shrink-0 object-contain"
    />

    <div class="flex min-w-0 flex-col">
      <h1 class="text-xl font-semibold text-highlighted">
        {{ device.label }}
      </h1>
      <p
        v-if="summary"
        class="text-sm text-muted"
      >
        {{ summary }}
      </p>
    </div>

    <div class="flex w-full flex-col items-start gap-1 sm:ms-auto sm:w-auto sm:items-end">
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        icon="mdi:download"
        @click="emit('download')"
      >
        {{ $t('device.download') }}
      </UButton>
      <UAlert
        v-if="downloadError"
        color="error"
        variant="subtle"
        :description="downloadError"
      />
    </div>
  </div>
</template>
