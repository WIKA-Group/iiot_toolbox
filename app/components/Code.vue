<script setup lang="ts">
type Props = {
  code: string
}

defineProps<Props>()

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
    <pre class="bg-elevated rounded p-2 text-xs text-default overflow-x-auto max-w-full">
{{ code }}
</pre>
    <UButton
      size="xs"
      color="primary"
      variant="soft"
      class="absolute top-2 right-2"
      icon="mdi:content-copy"
      @click="copyToClipboard(code)"
    />
  </div>
</template>
