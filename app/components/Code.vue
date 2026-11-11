<script setup lang="ts">
type Props = {
  code: string
  copyable?: boolean
}

withDefaults(defineProps<Props>(), {
  copyable: true,
})

const toast = useToast()

const {
  copy,
} = useClipboard()

function copyToClipboard(text: string) {
  toast.clear()
  copy(text).then(() => {
    toast.add({
      title: 'Copied to clipboard',
      color: 'primary',
      icon: 'mdi:check',
      duration: 1500,
    })
  }).catch(() => {
    toast.add({
      title: 'Failed to copy',
      color: 'error',
      icon: 'mdi:alert',
      duration: 1500,
    })
  })
}
</script>

<template>
  <div class="relative w-full overflow-x-auto">
    <pre class="max-w-full overflow-x-auto rounded bg-elevated p-2 pe-10 text-xs text-default">
{{ code }}
</pre>
    <UTooltip
      v-if="copyable"
      text="Copy code"
    >
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="absolute top-1.5 right-1.5"
        icon="mdi:content-copy"
        aria-label="Copy code"
        @click="copyToClipboard(code)"
      />
    </UTooltip>
  </div>
</template>
